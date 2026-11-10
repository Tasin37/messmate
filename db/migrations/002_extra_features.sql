-- Extra Useful Features: Shopping List, Bazaar Roster, Mess Utensils/Inventory, Complaints/Suggestions

CREATE TABLE IF NOT EXISTS bazaar_roster (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mess_id UUID NOT NULL REFERENCES messes(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES mess_members(id) ON DELETE CASCADE,
  duty_date DATE NOT NULL,
  note TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'completed', 'swapped', 'missed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_mess_duty_date UNIQUE (mess_id, duty_date)
);

CREATE TABLE IF NOT EXISTS shopping_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mess_id UUID NOT NULL REFERENCES messes(id) ON DELETE CASCADE,
  item_name VARCHAR(150) NOT NULL,
  quantity VARCHAR(50),
  added_by UUID REFERENCES mess_members(id) ON DELETE SET NULL,
  is_purchased BOOLEAN NOT NULL DEFAULT false,
  purchased_by UUID REFERENCES mess_members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mess_id UUID NOT NULL REFERENCES messes(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  category VARCHAR(50) DEFAULT 'utensils',
  condition VARCHAR(30) DEFAULT 'good' CHECK (condition IN ('new', 'good', 'damaged', 'repair_needed')),
  location VARCHAR(100),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mess_id UUID NOT NULL REFERENCES messes(id) ON DELETE CASCADE,
  member_id UUID REFERENCES mess_members(id) ON DELETE SET NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  resolution_note TEXT,
  resolved_by TEXT REFERENCES "user"(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bazaar_roster_mess_date ON bazaar_roster(mess_id, duty_date);
CREATE INDEX IF NOT EXISTS idx_shopping_list_mess ON shopping_list_items(mess_id, is_purchased);
CREATE INDEX IF NOT EXISTS idx_inventory_mess ON inventory_items(mess_id);
CREATE INDEX IF NOT EXISTS idx_complaints_mess_status ON complaints(mess_id, status);
