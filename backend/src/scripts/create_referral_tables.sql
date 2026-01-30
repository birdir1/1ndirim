-- ============================================
-- REFERRAL SYSTEM TABLES SCHEMA
-- ============================================

-- User Referrals Table
-- Kullanıcıların referral ilişkileri
CREATE TABLE IF NOT EXISTS user_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id VARCHAR(255) NOT NULL, -- Davet eden (Firebase UID)
  referred_id VARCHAR(255) NOT NULL, -- Davet edilen (Firebase UID)
  referral_code VARCHAR(20) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'expired'
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(referred_id), -- Bir kullanıcı sadece bir kez davet edilebilir
  CONSTRAINT check_different_users CHECK (referrer_id != referred_id)
);

-- Referral Codes Table
-- Her kullanıcının unique referral kodu
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL UNIQUE, -- Firebase UID
  code VARCHAR(20) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT check_code_format CHECK (LENGTH(code) >= 6)
);

-- Referral Rewards Table (Gelecek için hazır)
-- Referral ödülleri
CREATE TABLE IF NOT EXISTS referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  referral_id UUID REFERENCES user_referrals(id) ON DELETE CASCADE,
  reward_type VARCHAR(50), -- 'points', 'badge', 'feature'
  reward_value INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'claimed', 'expired'
  claimed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT check_reward_value CHECK (reward_value >= 0)
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_user_referrals_referrer ON user_referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_user_referrals_referred ON user_referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_user_referrals_code ON user_referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_user_referrals_status ON user_referrals(status);
CREATE INDEX IF NOT EXISTS idx_user_referrals_created ON user_referrals(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_referral_codes_user ON referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);

CREATE INDEX IF NOT EXISTS idx_referral_rewards_user ON referral_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_referral ON referral_rewards(referral_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_status ON referral_rewards(status);

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION update_referral_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_referrals_updated_at
  BEFORE UPDATE ON user_referrals
  FOR EACH ROW
  EXECUTE FUNCTION update_referral_updated_at();

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code(p_user_id VARCHAR(255))
RETURNS VARCHAR(20) AS $$
DECLARE
  v_code VARCHAR(20);
  v_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 8 character code (uppercase letters + numbers)
    v_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || p_user_id || NOW()::TEXT) FROM 1 FOR 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM referral_codes WHERE code = v_code) INTO v_exists;
    
    -- If unique, exit loop
    EXIT WHEN NOT v_exists;
  END LOOP;
  
  RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- Function to get or create referral code
CREATE OR REPLACE FUNCTION get_or_create_referral_code(p_user_id VARCHAR(255))
RETURNS VARCHAR(20) AS $$
DECLARE
  v_code VARCHAR(20);
BEGIN
  -- Try to get existing code
  SELECT code INTO v_code FROM referral_codes WHERE user_id = p_user_id;
  
  -- If not exists, create new one
  IF v_code IS NULL THEN
    v_code := generate_referral_code(p_user_id);
    INSERT INTO referral_codes (user_id, code) VALUES (p_user_id, v_code);
  END IF;
  
  RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE user_referrals IS 'Kullanıcıların referral ilişkileri';
COMMENT ON TABLE referral_codes IS 'Her kullanıcının unique referral kodu';
COMMENT ON TABLE referral_rewards IS 'Referral ödülleri (gelecek için)';

COMMENT ON COLUMN user_referrals.referrer_id IS 'Davet eden kullanıcı (Firebase UID)';
COMMENT ON COLUMN user_referrals.referred_id IS 'Davet edilen kullanıcı (Firebase UID)';
COMMENT ON COLUMN user_referrals.status IS 'pending: Henüz tamamlanmadı, completed: Tamamlandı, expired: Süresi doldu';

COMMENT ON COLUMN referral_rewards.reward_type IS 'points: Puan, badge: Rozet, feature: Özellik açma';
COMMENT ON COLUMN referral_rewards.status IS 'pending: Bekliyor, claimed: Talep edildi, expired: Süresi doldu';
