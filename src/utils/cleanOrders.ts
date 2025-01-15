import { SupabaseClient } from '@supabase/supabase-js';

export const cleanOldOrders = async (supabase: SupabaseClient) => {
  try {
    const twelveHoursAgo = new Date();
    twelveHoursAgo.setHours(twelveHoursAgo.getHours() - 12);

    // Primeiro, deletar os order_items relacionados
    const { error: itemsError } = await supabase
      .from('order_items')
      .delete()
      .lt('created_at', twelveHoursAgo.toISOString());

    if (itemsError) throw itemsError;

    // Depois, deletar os pedidos
    const { error: ordersError } = await supabase
      .from('orders')
      .delete()
      .lt('created_at', twelveHoursAgo.toISOString());

    if (ordersError) throw ordersError;

    return true;
  } catch (error) {
    console.error('Erro ao limpar pedidos antigos:', error);
    return false;
  }
};
