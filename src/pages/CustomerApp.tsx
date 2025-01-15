import { useState, useEffect } from 'react';
import { ShoppingCart, Menu, Clock, Truck, Store, Search, X, LogOut, Trash2, ChevronDown, User } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useCartStore } from '../store/cart';
import { useNavigate } from 'react-router-dom';
import { cleanOldOrders } from '../utils/cleanOrders';

type OrderItem = {
  id: string;
  product: {
    image_url: string;
    name: string;
  };
  quantity: number;
  price: number;
};

function CustomerApp() {
  const [activeTab, setActiveTab] = useState('menu');
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();
  const [checkoutForm, setCheckoutForm] = useState({
    deliveryType: 'delivery',
    address: '',
    name: '',
    phone: ''
  });
  const [orders, setOrders] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const cart = useCartStore();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    // Verificar se o usuário está logado
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      setUser(session.user);
      
      // Buscar o nome do usuário
      const { data: userData, error } = await supabase
        .from('users')
        .select('name')
        .eq('phone', session.user.email?.replace('@temp.com', ''))
        .single();

      if (!error && userData) {
        setUserName(userData.name);
      }
    };

    checkUser();
    fetchProducts();
    fetchBannerImage();

    // Configurar limpeza automática de pedidos antigos
    const cleanOrders = async () => {
      const cleaned = await cleanOldOrders(supabase);
      if (cleaned) {
        fetchOrders(); // Atualiza a lista após limpar
      }
    };

    // Executar limpeza a cada 5 minutos
    cleanOrders(); // Executa imediatamente
    const interval = setInterval(cleanOrders, 300000); // 5 minutos em milissegundos

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchCategories();

    // Adiciona o comportamento de touch scroll para as categorias
    const categoriesContainer = document.getElementById('categories-scroll');
    let isDown = false;
    let startX: number;
    let scrollLeft: number;

    if (categoriesContainer) {
      categoriesContainer.addEventListener('mousedown', (e) => {
        isDown = true;
        categoriesContainer.classList.add('cursor-grabbing');
        startX = e.pageX - categoriesContainer.offsetLeft;
        scrollLeft = categoriesContainer.scrollLeft;
      });

      categoriesContainer.addEventListener('mouseleave', () => {
        isDown = false;
        categoriesContainer.classList.remove('cursor-grabbing');
      });

      categoriesContainer.addEventListener('mouseup', () => {
        isDown = false;
        categoriesContainer.classList.remove('cursor-grabbing');
      });

      categoriesContainer.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - categoriesContainer.offsetLeft;
        const walk = (x - startX) * 2;
        categoriesContainer.scrollLeft = scrollLeft - walk;
      });

      // Touch events
      categoriesContainer.addEventListener('touchstart', (e) => {
        isDown = true;
        startX = e.touches[0].pageX - categoriesContainer.offsetLeft;
        scrollLeft = categoriesContainer.scrollLeft;
      });

      categoriesContainer.addEventListener('touchend', () => {
        isDown = false;
      });

      categoriesContainer.addEventListener('touchmove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.touches[0].pageX - categoriesContainer.offsetLeft;
        const walk = (x - startX) * 2;
        categoriesContainer.scrollLeft = scrollLeft - walk;
      });
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const userMenu = document.getElementById('user-menu-button');
      const dropdown = document.getElementById('user-menu-dropdown');
      if (!userMenu?.contains(event.target as Node) && !dropdown?.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return;
    }

    if (data) {
      setUserProfile(data);
      setCheckoutForm(prev => ({
        ...prev,
        name: data.name,
        phone: data.phone
      }));
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('user');
      setUser(null);
      cart.clearCart();
      navigate('/auth');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*');
    setCategories(data || []);
    if (data) {
      const lanchesCategory = data.find(cat => cat.name.toLowerCase() === 'lanches');
      if (lanchesCategory) {
        setSelectedCategory(lanchesCategory);
      }
    }
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*');
    setProducts(data || []);
  };

  const fetchOrders = async () => {
    if (!user) return;
    
    const { data: orders } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          product: products (*)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setOrders(orders || []);
  };

  const fetchBannerImage = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('banner_image')
        .single();
      
      if (error) throw error;
      if (data?.banner_image) {
        setBannerImage(data.banner_image);
      }
    } catch (error) {
      console.error('Erro ao carregar imagem do banner:', error);
    }
  };

  const handleCheckout = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Por favor, faça login para continuar');
      navigate('/auth');
      return;
    }

    if (cart.items.length === 0) {
      toast.error('Seu carrinho está vazio');
      return;
    }
    
    if (checkoutForm.deliveryType === 'delivery' && !checkoutForm.address) {
      toast.error('Por favor, informe o endereço para entrega');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Sua sessão expirou. Por favor, faça login novamente.');
        navigate('/auth');
        return;
      }

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: session.user.id,
          customer_name: checkoutForm.name,
          phone: checkoutForm.phone,
          delivery_type: checkoutForm.deliveryType,
          address: checkoutForm.address,
          total: cart.total(),
          status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = cart.items.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      toast.success('Pedido realizado com sucesso!');
      cart.clearCart();
      setIsCheckoutOpen(false);
      setIsCartOpen(false);
      fetchOrders();
      
      setCheckoutForm(prev => ({
        ...prev,
        address: '',
        name: '',
        phone: ''
      }));
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Erro ao criar pedido. Tente novamente.');
    }
  };

  const getProductImage = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product?.image_url;
  };

  // Filtra os produtos baseado na categoria selecionada e termo de busca
  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === null || product.category_id === selectedCategory?.id;
    const matchesSearch = searchTerm.trim() === '' || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner */}
      <div className="relative h-[400px] md:h-[500px] overflow-hidden">
        <img
          src="https://i.postimg.cc/g20sCCWS/Banner-Hamburgueria-Moderno-Laranja-Branco-e-Amarelo-1.jpg"
          alt="Banner do restaurante"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative h-full container mx-auto px-4 flex flex-col items-center justify-center text-center">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-white">
           
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-3xl leading-relaxed">
           
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Cardápio</h1>
            <div className="flex items-center gap-4">
              {user && (
                <div className="relative">
                  <button
                    id="user-menu-button"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 text-gray-700 hover:text-red-600 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
                  >
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-red-600" />
                    </div>
                    <span className="font-medium">{userName}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {/* Menu dropdown */}
                  {isUserMenuOpen && (
                    <div
                      id="user-menu-dropdown"
                      className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-200"
                    >
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 w-full text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sair</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 mb-20">
        {activeTab === 'menu' && (
          <>
            {/* Menu Section */}
            <div className="container mx-auto px-4 py-8">
              <div className="mb-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Buscar produtos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  </div>
                </div>

                {/* Categories */}
                <div 
                  id="categories-scroll"
                  className="flex gap-4 overflow-x-hidden cursor-grab active:cursor-grabbing touch-pan-x select-none"
                  style={{
                    WebkitOverflowScrolling: 'touch',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                  }}
                >
                  <div className="flex gap-4 pb-4 min-w-full">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id === selectedCategory ? null : category)}
                        className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                          selectedCategory?.id === category.id
                            ? 'bg-red-600 text-white'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Products Grid */}
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => (
                    <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-red-800 mb-2">{product.name}</h3>
                        <p className="text-gray-600 text-sm mb-4">{product.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-red-700 font-bold">
                            R$ {product.price.toFixed(2)}
                          </span>
                          <button
                            onClick={() => {
                              cart.addItem({
                                id: product.id,
                                name: product.name,
                                price: product.price,
                                quantity: 1
                              });
                              toast.success('Item adicionado ao carrinho!');
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            Adicionar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nenhum produto encontrado</p>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6">Meus Pedidos</h2>
            {orders.length === 0 ? (
              <p className="text-gray-500 text-center">Nenhum pedido realizado ainda</p>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold">Pedido #{order.id.slice(0, 8)}</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(order.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'accepted' ? 'bg-purple-100 text-purple-800' :
                        order.status === 'preparing' ? 'bg-orange-100 text-orange-800' :
                        order.status === 'delivering' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status === 'pending' ? 'Pendente' :
                         order.status === 'accepted' ? 'Aceito' :
                         order.status === 'preparing' ? 'Em preparo' :
                         order.status === 'delivering' ? 'Em entrega' :
                         order.status === 'completed' ? 'Finalizado' :
                         'Desconhecido'}
                      </span>
                    </div>
                    <div className="space-y-2">
                        {order.order_items.map((item: OrderItem) => (
                        <div key={item.id} className="flex items-center gap-4">
                          <img
                          src={item.product.image_url}
                            alt={item.product.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                          <div>
                            <p className="font-medium">{item.product.name}</p>
                            <p className="text-sm text-gray-600">
                              {item.quantity}x R$ {item.price.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-600">{order.customer_name}</p>
                          <p className="text-sm text-gray-600">{order.phone}</p>
                          <p className="text-sm text-gray-600">
                            {order.delivery_type === 'delivery' ? 'Entrega' : 'Retirada'}
                          </p>
                          {order.address && (
                            <p className="text-sm text-gray-600">{order.address}</p>
                          )}
                        </div>
                        <p className="font-bold">Total: R$ {order.total.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cart Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-red-800">Carrinho</h2>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="text-gray-500 hover:text-red-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {cart.items.length === 0 ? (
                  <p className="text-gray-500 text-center">Seu carrinho está vazio</p>
                ) : (
                  <>
                    <div className="space-y-4">
                      {cart.items.map((item) => (
                        <div key={item.id} className="flex gap-4">
                          <img
                            src={getProductImage(item.id)}
                            alt={item.name}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <h3 className="font-semibold">{item.name}</h3>
                            <p className="text-gray-600">
                              R$ {item.price.toFixed(2)} x {item.quantity}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                onClick={() => cart.updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                                className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                              >
                                -
                              </button>
                              <span>{item.quantity}</span>
                              <button
                                onClick={() => cart.updateQuantity(item.id, item.quantity + 1)}
                                className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                              >
                                +
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={() => cart.removeItem(item.id)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                            title="Remover item"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 border-t pt-4">
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-bold">Total:</span>
                        <span className="font-bold">R$ {cart.total().toFixed(2)}</span>
                      </div>
                      <button
                        onClick={() => {
                          setIsCheckoutOpen(true);
                          setIsCartOpen(false);
                        }}
                        className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Finalizar Pedido
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-red-800">Finalizar Pedido</h2>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCheckout} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  id="name"
                  value={checkoutForm.name}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={checkoutForm.phone}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Entrega
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setCheckoutForm({ ...checkoutForm, deliveryType: 'delivery' })}
                    className={`flex flex-col items-center justify-center p-4 border rounded-lg ${
                      checkoutForm.deliveryType === 'delivery'
                        ? 'border-red-600 bg-red-100'
                        : 'border-gray-200'
                    }`}
                  >
                    <Truck className={`w-6 h-6 ${
                      checkoutForm.deliveryType === 'delivery' ? 'text-red-600' : 'text-gray-400'
                    }`} />
                    <span className="mt-1 text-sm">Entrega</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCheckoutForm({ ...checkoutForm, deliveryType: 'pickup', address: '' })}
                    className={`flex flex-col items-center justify-center p-4 border rounded-lg ${
                      checkoutForm.deliveryType === 'pickup'
                        ? 'border-red-600 bg-red-100'
                        : 'border-gray-200'
                    }`}
                  >
                    <Store className={`w-6 h-6 ${
                      checkoutForm.deliveryType === 'pickup' ? 'text-red-600' : 'text-gray-400'
                    }`} />
                    <span className="mt-1 text-sm">Retirada</span>
                  </button>
                </div>
              </div>

              {checkoutForm.deliveryType === 'delivery' && (
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    Endereço para Entrega
                  </label>
                  <textarea
                    id="address"
                    value={checkoutForm.address}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, address: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-orange-500 focus:border-orange-500"
                    rows={3}
                    required
                    placeholder="Digite seu endereço completo"
                  />
                </div>
              )}

              <div className="border-t pt-4 mt-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-bold">Total:</span>
                  <span className="font-bold">R$ {cart.total().toFixed(2)}</span>
                </div>
                <button
                  type="submit"
                  className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Confirmar Pedido
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around items-center h-16">
          <button
            onClick={() => setActiveTab('menu')}
            className={`flex flex-col items-center justify-center w-1/4 h-full ${
              activeTab === 'menu' ? 'text-red-600' : 'text-gray-500 hover:text-red-500'
            }`}
          >
            <Menu className="w-6 h-6" />
            <span className="text-xs mt-1">Cardápio</span>
          </button>

          <button
            onClick={() => setIsCartOpen(true)}
            className={`flex flex-col items-center justify-center w-1/4 h-full relative ${
              isCartOpen ? 'text-red-600' : 'text-gray-500 hover:text-red-500'
            }`}
          >
            <ShoppingCart className="w-6 h-6" />
            <span className="text-xs mt-1">Carrinho</span>
            {cart.items.length > 0 && (
              <span className="absolute top-1 right-6 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cart.items.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex flex-col items-center justify-center w-1/4 h-full ${
              activeTab === 'orders' ? 'text-red-600' : 'text-gray-500 hover:text-red-500'
            }`}
          >
            <Clock className="w-6 h-6" />
            <span className="text-xs mt-1">Pedidos</span>
          </button>
        </div>
      </div>

      <Toaster position="top-center" />
    </div>
  );
}

export default CustomerApp;