CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE customers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name text NOT NULL,
    mobile text NOT NULL,
    tel text,
    line_user_id text,
    city text NOT NULL,
    address text NOT NULL,
    source text NOT NULL DEFAULT 'website',
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,

    CONSTRAINT customers_customer_name_not_blank_check CHECK (
        length(trim(customer_name)) > 0
    ),
    CONSTRAINT customers_mobile_not_blank_check CHECK (
        length(trim(mobile)) > 0
    ),
    CONSTRAINT customers_city_not_blank_check CHECK (
        length(trim(city)) > 0
    ),
    CONSTRAINT customers_address_not_blank_check CHECK (
        length(trim(address)) > 0
    ),
    CONSTRAINT customers_source_check CHECK (
        source IN (
            'line',
            'website',
            'admin',
            'api',
            'migration',
            'phone',
            'whatsapp',
            'facebook',
            'instagram',
            'email'
        )
    ),
    CONSTRAINT customers_deleted_after_created_check CHECK (
        deleted_at IS NULL OR deleted_at >= created_at
    )
);

CREATE FUNCTION set_customers_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_customers_set_updated_at
BEFORE UPDATE ON customers
FOR EACH ROW
EXECUTE FUNCTION set_customers_updated_at();

CREATE INDEX idx_customers_mobile ON customers(mobile) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_customers_line_user_id_unique ON customers(line_user_id) WHERE line_user_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_customers_city ON customers(city) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_created_at ON customers(created_at DESC);

CREATE TABLE dispatch_units (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    code text NOT NULL,
    service_region text,
    city text,
    product_types text[] NOT NULL DEFAULT '{}',
    enabled boolean NOT NULL DEFAULT true,
    priority integer NOT NULL DEFAULT 100,
    routing_rules jsonb,
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,

    CONSTRAINT dispatch_units_name_not_blank_check CHECK (
        length(trim(name)) > 0
    ),
    CONSTRAINT dispatch_units_code_not_blank_check CHECK (
        length(trim(code)) > 0
    ),
    CONSTRAINT dispatch_units_priority_check CHECK (
        priority >= 0
    ),
    CONSTRAINT dispatch_units_routing_rules_type_check CHECK (
        routing_rules IS NULL OR jsonb_typeof(routing_rules) = 'object'
    ),
    CONSTRAINT dispatch_units_deleted_after_created_check CHECK (
        deleted_at IS NULL OR deleted_at >= created_at
    )
);

CREATE FUNCTION set_dispatch_units_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_dispatch_units_set_updated_at
BEFORE UPDATE ON dispatch_units
FOR EACH ROW
EXECUTE FUNCTION set_dispatch_units_updated_at();

CREATE UNIQUE INDEX idx_dispatch_units_code_unique ON dispatch_units(code) WHERE deleted_at IS NULL;
CREATE INDEX idx_dispatch_units_enabled_priority ON dispatch_units(enabled, priority) WHERE deleted_at IS NULL;
CREATE INDEX idx_dispatch_units_service_region ON dispatch_units(service_region) WHERE service_region IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_dispatch_units_city ON dispatch_units(city) WHERE city IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_dispatch_units_product_types ON dispatch_units USING gin (product_types);

CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name text NOT NULL,
    email text,
    mobile text,
    user_type text NOT NULL,
    status text NOT NULL DEFAULT 'active',
    password_hash text,
    auth_provider text NOT NULL DEFAULT 'password',
    external_auth_id text,
    last_login_at timestamptz,
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,

    CONSTRAINT users_display_name_not_blank_check CHECK (
        length(trim(display_name)) > 0
    ),
    CONSTRAINT users_user_type_check CHECK (
        user_type IN (
            'admin',
            'customer_service',
            'dispatch_manager',
            'engineer',
            'auditor',
            'system'
        )
    ),
    CONSTRAINT users_status_check CHECK (
        status IN ('active', 'inactive', 'suspended', 'invited')
    ),
    CONSTRAINT users_auth_provider_check CHECK (
        auth_provider IN ('password', 'google', 'microsoft', 'line', 'system', 'other')
    ),
    CONSTRAINT users_password_or_external_auth_check CHECK (
        password_hash IS NOT NULL
        OR auth_provider <> 'password'
    ),
    CONSTRAINT users_deleted_after_created_check CHECK (
        deleted_at IS NULL OR deleted_at >= created_at
    )
);

CREATE FUNCTION set_users_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_users_updated_at();

CREATE UNIQUE INDEX idx_users_email_unique ON users(lower(email)) WHERE email IS NOT NULL AND deleted_at IS NULL;
CREATE UNIQUE INDEX idx_users_external_auth_unique ON users(auth_provider, external_auth_id) WHERE external_auth_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_users_mobile ON users(mobile) WHERE mobile IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_users_user_type_status ON users(user_type, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_last_login_at ON users(last_login_at DESC) WHERE last_login_at IS NOT NULL;

CREATE TABLE roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    role_key text NOT NULL,
    name text NOT NULL,
    description text,
    enabled boolean NOT NULL DEFAULT true,
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,

    CONSTRAINT roles_role_key_not_blank_check CHECK (
        length(trim(role_key)) > 0
    ),
    CONSTRAINT roles_name_not_blank_check CHECK (
        length(trim(name)) > 0
    ),
    CONSTRAINT roles_default_role_key_check CHECK (
        role_key IN (
            'admin',
            'customer_service',
            'dispatch_manager',
            'engineer',
            'auditor',
            'system'
        )
        OR role_key ~ '^[a-z][a-z0-9_]*$'
    ),
    CONSTRAINT roles_deleted_after_created_check CHECK (
        deleted_at IS NULL OR deleted_at >= created_at
    )
);

CREATE FUNCTION set_roles_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_roles_set_updated_at
BEFORE UPDATE ON roles
FOR EACH ROW
EXECUTE FUNCTION set_roles_updated_at();

CREATE UNIQUE INDEX idx_roles_role_key_unique ON roles(role_key) WHERE deleted_at IS NULL;
CREATE INDEX idx_roles_enabled ON roles(enabled) WHERE deleted_at IS NULL;

CREATE TABLE permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    permission_key text NOT NULL,
    module text NOT NULL,
    action text NOT NULL,
    description text,
    enabled boolean NOT NULL DEFAULT true,
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,

    CONSTRAINT permissions_permission_key_not_blank_check CHECK (
        length(trim(permission_key)) > 0
    ),
    CONSTRAINT permissions_module_not_blank_check CHECK (
        length(trim(module)) > 0
    ),
    CONSTRAINT permissions_action_not_blank_check CHECK (
        length(trim(action)) > 0
    ),
    CONSTRAINT permissions_key_format_check CHECK (
        permission_key = module || '.' || action
    ),
    CONSTRAINT permissions_deleted_after_created_check CHECK (
        deleted_at IS NULL OR deleted_at >= created_at
    )
);

CREATE FUNCTION set_permissions_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_permissions_set_updated_at
BEFORE UPDATE ON permissions
FOR EACH ROW
EXECUTE FUNCTION set_permissions_updated_at();

CREATE UNIQUE INDEX idx_permissions_permission_key_unique ON permissions(permission_key) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_permissions_module_action_unique ON permissions(module, action) WHERE deleted_at IS NULL;
CREATE INDEX idx_permissions_module ON permissions(module) WHERE deleted_at IS NULL;
CREATE INDEX idx_permissions_enabled ON permissions(enabled) WHERE deleted_at IS NULL;

CREATE TABLE user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by uuid REFERENCES users(id),
    assigned_at timestamptz NOT NULL DEFAULT now(),
    revoked_at timestamptz,
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,

    CONSTRAINT user_roles_revoked_after_assigned_check CHECK (
        revoked_at IS NULL OR revoked_at >= assigned_at
    ),
    CONSTRAINT user_roles_deleted_after_created_check CHECK (
        deleted_at IS NULL OR deleted_at >= created_at
    )
);

CREATE FUNCTION set_user_roles_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_roles_set_updated_at
BEFORE UPDATE ON user_roles
FOR EACH ROW
EXECUTE FUNCTION set_user_roles_updated_at();

CREATE UNIQUE INDEX idx_user_roles_active_unique ON user_roles(user_id, role_id) WHERE revoked_at IS NULL AND deleted_at IS NULL;
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_user_roles_assigned_by ON user_roles(assigned_by) WHERE assigned_by IS NOT NULL;

CREATE TABLE role_permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted_by uuid REFERENCES users(id),
    granted_at timestamptz NOT NULL DEFAULT now(),
    revoked_at timestamptz,
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,

    CONSTRAINT role_permissions_revoked_after_granted_check CHECK (
        revoked_at IS NULL OR revoked_at >= granted_at
    ),
    CONSTRAINT role_permissions_deleted_after_created_check CHECK (
        deleted_at IS NULL OR deleted_at >= created_at
    )
);

CREATE FUNCTION set_role_permissions_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_role_permissions_set_updated_at
BEFORE UPDATE ON role_permissions
FOR EACH ROW
EXECUTE FUNCTION set_role_permissions_updated_at();

CREATE UNIQUE INDEX idx_role_permissions_active_unique ON role_permissions(role_id, permission_id) WHERE revoked_at IS NULL AND deleted_at IS NULL;
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_role_permissions_granted_by ON role_permissions(granted_by) WHERE granted_by IS NOT NULL;
