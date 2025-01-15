import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, RefreshCcw, Search, Filter, ChevronDown, UtensilsCrossed, Settings, LayoutGrid, MoreVertical, X, Clock, MapPin, CreditCard, Printer } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { supabase } from '../lib/supabase';

const ORDER_STATUSES = [
  { value: 'pending', label: 'Pendentes', color: 'bg-yellow-100 text-yellow-800', icon: '🟡' },
  { value: 'accepted', label: 'Aceito', color: 'bg-purple-100 text-purple-800', icon: '🟣' },
  { value: 'preparing', label: 'Preparo', color: 'bg-orange-100 text-orange-800', icon: '🟠' },
  { value: 'delivering', label: 'Entrega', color: 'bg-blue-100 text-blue-800', icon: '🔵' },
  { value: 'completed', label: 'Concluído', color: 'bg-green-100 text-green-800', icon: '🟢' }
];

function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
    
    const ordersSubscription = supabase
      .channel('orders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        async (payload) => {
          if (payload.eventType === 'UPDATE') {
            // Atualizar o pedido localmente
            setOrders(prevOrders => 
              prevOrders.map(order => 
                order.id === payload.new.id 
                  ? { ...order, ...payload.new, order_items: order.order_items }
                  : order
              )
            );
          } else if (payload.eventType === 'INSERT') {
            // Buscar o novo pedido com todos os relacionamentos
            const { data: newOrder } = await supabase
              .from('orders')
              .select(`
                *,
                order_items (
                  *,
                  product: products (*)
                )
              `)
              .eq('id', payload.new.id)
              .single();

            if (newOrder) {
              setOrders(prevOrders => [newOrder, ...prevOrders]);
            }
          } else if (payload.eventType === 'DELETE') {
            setOrders(prevOrders => 
              prevOrders.filter(order => order.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      ordersSubscription.unsubscribe();
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            product: products (*)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus, e) => {
    e.stopPropagation();
    try {
      // Atualizar o status no banco de dados
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      // Atualizar o pedido localmente
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId
            ? { ...order, status: newStatus, updated_at: new Date().toISOString() }
            : order
        )
      );

      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => ({
          ...prev,
          status: newStatus,
          updated_at: new Date().toISOString()
        }));
      }

      toast.success('Status atualizado com sucesso');
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  const handlePrintOrder = async (order) => {
    // Atualiza o status do pedido para 'accepted'
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (error) {
        console.error('Error updating order status:', error);
        toast.error('Erro ao atualizar status do pedido');
        return;
      }

      toast.success('Pedido aceito e impresso!');
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Erro ao atualizar status do pedido');
      return;
    }

    const printWindow = window.open('', '_blank');
    
    const printStyles = `
      <style>
        @page {
          margin: 1mm;
          size: 80mm auto;
        }
        body {
          font-family: 'Courier New', monospace;
          margin: 0;
          padding: 8px;
          width: 80mm;
          font-size: 12px;
          line-height: 1.2;
        }
        .header {
          text-align: center;
          border-bottom: 1px dashed #000;
          padding-bottom: 8px;
          margin-bottom: 8px;
        }
        .header h1 {
          font-size: 16px;
          margin: 0;
          padding: 0;
        }
        .header p {
          margin: 4px 0;
        }
        .divider {
          border-bottom: 1px dashed #000;
          margin: 8px 0;
        }
        .order-info {
          margin-bottom: 8px;
        }
        .order-info p {
          margin: 2px 0;
        }
        .items-table {
          width: 100%;
          margin: 8px 0;
          font-size: 12px;
        }
        .items-table td {
          padding: 2px 0;
        }
        .item-row {
          margin: 4px 0;
        }
        .quantity {
          width: 30px;
          text-align: center;
        }
        .price {
          text-align: right;
        }
        .total {
          text-align: right;
          font-weight: bold;
          border-top: 1px dashed #000;
          padding-top: 8px;
          margin-top: 8px;
        }
        .footer {
          text-align: center;
          margin-top: 16px;
          font-size: 11px;
        }
        @media print {
          .no-print { display: none; }
        }
      </style>
    `;

    const getStatusLabel = (status) => {
      const statusObj = ORDER_STATUSES.find(s => s.value === status);
      return statusObj ? statusObj.label : status;
    };

    const formatDateTime = (date) => {
      const d = new Date(date);
      return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Pedido #${order.id.slice(0, 4)}</title>
          <meta charset="UTF-8">
          ${printStyles}
        </head>
        <body>
          <div class="header">
            <h1>Chapa Quente</h1>
            <p>================================</p>
            <p>PEDIDO #${order.id.slice(0, 4)}</p>
            <p>${formatDateTime(order.created_at)}</p>
          </div>

          <div class="order-info">
            <p>CLIENTE: ${order.customer_name}</p>
            <p>TELEFONE: ${order.phone}</p>
            <p>TIPO: ${order.delivery_type === 'delivery' ? 'ENTREGA' : 'RETIRADA'}</p>
            ${order.delivery_type === 'delivery' ? `<p>ENDEREÇO: ${order.address}</p>` : ''}
            <p>STATUS: ${getStatusLabel(order.status)}</p>
          </div>

          <div class="divider"></div>
          <p style="text-align: center;">ITENS DO PEDIDO</p>
          <div class="divider"></div>

          ${order.order_items.map(item => `
            <div class="item-row">
              <div>${item.quantity}x ${item.product.name}</div>
              <div style="display: flex; justify-content: space-between;">
                <span>R$ ${item.product.price.toFixed(2)} un</span>
                <span>R$ ${(item.quantity * item.product.price).toFixed(2)}</span>
              </div>
            </div>
          `).join('')}

          <div class="total">
            <p style="margin: 4px 0;">TOTAL: R$ ${order.total.toFixed(2)}</p>
          </div>

          <div class="footer">
            <div class="divider"></div>
            <p>Agradecemos a preferência!</p>
            <p>${new Date().toLocaleDateString('pt-BR')}</p>
          </div>

          <div class="no-print" style="margin-top: 20px; text-align: center;">
            <button onclick="window.print()" style="
              padding: 8px 16px;
              background: #000;
              color: #fff;
              border: none;
              border-radius: 4px;
              cursor: pointer;
            ">Imprimir</button>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const getTimeAgo = (date) => {
    const minutes = Math.floor((new Date() - new Date(date)) / 60000);
    return `Recebido há ${minutes} minutos`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin">
          <RefreshCcw className="w-8 h-8 text-purple-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fe]">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-[1400px] mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="bg-purple-500 p-2 rounded-lg">
                  <UtensilsCrossed className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-lg font-semibold text-gray-900">Pedidos</h1>
              </div>
              
              {/* Status Filters */}
              <div className="flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {ORDER_STATUSES.map(status => (
                  <button
                    key={status.value}
                    onClick={() => setStatusFilter(status.value)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap min-w-fit
                      ${statusFilter === status.value ? status.color : 'bg-gray-100 text-gray-600'}`}
                  >
                    <span>{status.icon}</span>
                    <span>{status.label}</span>
                    <span className="bg-white bg-opacity-50 px-1.5 rounded-full">
                      {orders.filter(o => o.status === status.value).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="p-2 text-gray-500 hover:text-gray-700">
                <Search className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-500 hover:text-gray-700">
                <Settings className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-500 hover:text-gray-700">
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button
                onClick={handleSignOut}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-medium text-gray-900">#{order.id.slice(0, 4)}</h3>
                  <p className="text-sm text-gray-500">{getTimeAgo(order.created_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value, e)}
                    className={`px-3 py-1 text-sm rounded-full border-0 font-medium cursor-pointer ${
                      ORDER_STATUSES.find(s => s.value === order.status)?.color
                    }`}
                  >
                    {ORDER_STATUSES.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOrder(order);
                    }} 
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                    {order.customer_name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{order.customer_name}</p>
                    <p className="text-sm text-gray-500">{order.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <span className={`px-2 py-0.5 rounded-full ${
                    order.delivery_type === 'delivery' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {order.delivery_type === 'delivery' ? 'Entrega' : 'Retirada'}
                  </span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-500">
                    {order.order_items.reduce((acc, item) => acc + item.quantity, 0)} itens
                  </span>
                </div>

                <div className="pt-2 border-t">
                  <p className="font-medium text-gray-900">
                    R$ {order.total.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {order.order_items.map(item => item.product.name).join(', ')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhum pedido encontrado</p>
          </div>
        )}
      </main>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold">
                  Pedido #{selectedOrder.id.slice(0, 4)}
                </h2>
                <select
                  value={selectedOrder.status}
                  onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value, e)}
                  className={`px-3 py-1 text-sm rounded-full border-0 font-medium ${
                    ORDER_STATUSES.find(s => s.value === selectedOrder.status)?.color
                  }`}
                >
                  {ORDER_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePrintOrder(selectedOrder)}
                  className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                  title="Imprimir Pedido"
                >
                  <Printer className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 text-lg">
                      {selectedOrder.customer_name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{selectedOrder.customer_name}</h3>
                      <p className="text-sm text-gray-500">{selectedOrder.phone}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{getTimeAgo(selectedOrder.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">
                        {selectedOrder.delivery_type === 'delivery' ? 'Entrega' : 'Retirada'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <CreditCard className="w-4 h-4" />
                      <span className="text-sm">Pagamento na entrega</span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Resumo do Pedido</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>R$ {selectedOrder.total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Taxa de entrega</span>
                      <span>R$ 0,00</span>
                    </div>
                    <div className="pt-2 border-t flex justify-between font-medium text-gray-900">
                      <span>Total</span>
                      <span>R$ {selectedOrder.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Itens do Pedido</h3>
                <div className="space-y-4">
                  {selectedOrder.order_items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4">
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{item.product.name}</p>
                            <p className="text-sm text-gray-500">{item.product.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">
                              R$ {(item.quantity * item.price).toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {item.quantity}x R$ {item.price.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <Toaster position="top-center" />
    </div>
  );
}

export default AdminDashboard;