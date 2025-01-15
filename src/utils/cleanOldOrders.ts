import { SupabaseClient } from '@supabase/supabase-js';

export const cleanOldOrders = async (supabase: SupabaseClient) => {
  try {
    const twelveHoursAgo = new Date();
    twelveHoursAgo.setHours(twelveHoursAgo.getHours() - 12);

    // Primeiro deletar os order_items antigos
    const { error: itemsError } = await supabase
      .from('order_items')
      .delete()
      .lt('created_at', twelveHoursAgo.toISOString());

    if (itemsError) {
      console.error('Erro ao deletar itens antigos:', itemsError);
      return false;
    }

    // Depois deletar os pedidos antigos
    const { error: ordersError } = await supabase
      .from('orders')
      .delete()
      .lt('created_at', twelveHoursAgo.toISOString());

    if (ordersError) {
      console.error('Erro ao deletar pedidos antigos:', ordersError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao limpar pedidos antigos:', error);
    return false;
  }
};
