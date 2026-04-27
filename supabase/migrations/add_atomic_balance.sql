-- ============================================================
-- Migration: Add Atomic Balance Deduction Function
-- Purpose: Prevent double-spending via race condition
-- ============================================================

-- Function untuk atomic balance deduction
-- Akan mengurangi saldo HANYA jika saldo mencukupi
-- Returns: new balance, atau NULL jika saldo tidak cukup
CREATE OR REPLACE FUNCTION deduct_balance(p_user_id TEXT, p_amount NUMERIC)
RETURNS NUMERIC AS $$
DECLARE
  v_new_balance NUMERIC;
BEGIN
  -- Atomic update with check
  UPDATE users
  SET balance = balance - p_amount
  WHERE id = p_user_id AND balance >= p_amount
  RETURNING balance INTO v_new_balance;

  -- If no rows updated, balance was insufficient
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql;
