-- Permitir deleção de pedidos antigos (mais de 12h)
create policy "Permitir deleção de pedidos antigos"
on orders for delete
using (created_at < now() - interval '12 hours');

-- Permitir deleção de itens de pedidos antigos
create policy "Permitir deleção de itens de pedidos antigos"
on order_items for delete
using (created_at < now() - interval '12 hours');
