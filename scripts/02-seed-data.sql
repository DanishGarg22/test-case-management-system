-- Seed demo users with different roles (passwords are hashed for 'password123')
INSERT INTO users (email, password_hash, full_name, role) VALUES
('admin@testcase.com', '$2a$10$rZ3GwF8YGqf3OJqRjO5qAOKxPqHh0vx8P7rnWJXPmVZCXPFVQfC9G', 'Admin User', 'admin'),
('testlead@testcase.com', '$2a$10$rZ3GwF8YGqf3OJqRjO5qAOKxPqHh0vx8P7rnWJXPmVZCXPFVQfC9G', 'Test Lead', 'test-lead'),
('tester@testcase.com', '$2a$10$rZ3GwF8YGqf3OJqRjO5qAOKxPqHh0vx8P7rnWJXPmVZCXPFVQfC9G', 'Tester User', 'tester'),
('readonly@testcase.com', '$2a$10$rZ3GwF8YGqf3OJqRjO5qAOKxPqHh0vx8P7rnWJXPmVZCXPFVQfC9G', 'Read Only User', 'read-only')
ON CONFLICT (email) DO NOTHING;

-- Seed demo project
INSERT INTO projects (name, description, version, status, created_by) VALUES
('E-Commerce Platform', 'Test cases for the main e-commerce application', 'v1.0.0', 'active', 1),
('Mobile App', 'Mobile application testing suite', 'v2.1.0', 'active', 1)
ON CONFLICT DO NOTHING;

-- Assign team members to projects
INSERT INTO project_members (project_id, user_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4),
(2, 1), (2, 2), (2, 3)
ON CONFLICT DO NOTHING;

-- Seed test suites
INSERT INTO test_suites (project_id, name, description, created_by) VALUES
(1, 'Smoke Test Suite', 'Critical path smoke tests for deployment verification', 1),
(1, 'Regression Suite', 'Full regression testing suite', 2),
(1, 'User Authentication Suite', 'All authentication related test cases', 2),
(2, 'Mobile UI Suite', 'Mobile user interface testing', 1)
ON CONFLICT DO NOTHING;

-- Seed test cases
INSERT INTO test_cases (project_id, title, description, priority, type, pre_conditions, post_conditions, tags, created_by, assigned_to) VALUES
(1, 'User Login - Valid Credentials', 'Verify user can login with valid username and password', 'Critical', 'Functional', 'User must have valid account', 'User successfully logged in', ARRAY['login', 'authentication', 'critical-path'], 1, 3),
(1, 'User Login - Invalid Password', 'Verify appropriate error message for invalid password', 'High', 'Functional', 'User account exists', 'Error message displayed', ARRAY['login', 'authentication', 'negative'], 1, 3),
(1, 'Add Product to Cart', 'Verify user can add product to shopping cart', 'High', 'Functional', 'User must be logged in, Product must be available', 'Product added to cart successfully', ARRAY['cart', 'shopping', 'e-commerce'], 2, 3),
(1, 'Checkout Process', 'Verify complete checkout flow with payment', 'Critical', 'Integration', 'User logged in, Items in cart, Valid payment method', 'Order placed successfully', ARRAY['checkout', 'payment', 'critical-path'], 1, 3),
(1, 'Search Functionality', 'Verify search returns relevant products', 'Medium', 'Functional', 'Products exist in database', 'Relevant products displayed', ARRAY['search', 'product-discovery'], 2, 3),
(1, 'Product Page Load Time', 'Verify product page loads within 2 seconds', 'High', 'UI', 'Valid product URL', 'Page loads successfully', ARRAY['performance', 'ui'], 2, 3),
(1, 'API - Get Product Details', 'Verify GET /api/products/{id} returns correct data', 'High', 'API', 'Valid product ID', 'Product JSON returned', ARRAY['api', 'backend'], 1, 3),
(2, 'Mobile - App Launch', 'Verify app launches successfully on first install', 'Critical', 'Smoke', 'Fresh installation', 'App opens to home screen', ARRAY['mobile', 'smoke', 'critical-path'], 1, 3),
(2, 'Mobile - Push Notifications', 'Verify push notifications are received', 'Medium', 'Functional', 'Notifications enabled', 'Notification displayed', ARRAY['mobile', 'notifications'], 1, 3)
ON CONFLICT DO NOTHING;

-- Seed test steps
INSERT INTO test_steps (test_case_id, step_number, description, expected_result) VALUES
(1, 1, 'Navigate to login page', 'Login page is displayed'),
(1, 2, 'Enter valid username', 'Username field accepts input'),
(1, 3, 'Enter valid password', 'Password field accepts input'),
(1, 4, 'Click Login button', 'User is redirected to dashboard'),
(2, 1, 'Navigate to login page', 'Login page is displayed'),
(2, 2, 'Enter valid username', 'Username field accepts input'),
(2, 3, 'Enter invalid password', 'Password field accepts input'),
(2, 4, 'Click Login button', 'Error message: "Invalid credentials" is displayed'),
(3, 1, 'Navigate to product page', 'Product details displayed'),
(3, 2, 'Click "Add to Cart" button', 'Success message displayed'),
(3, 3, 'Check cart icon', 'Cart count incremented by 1')
ON CONFLICT DO NOTHING;

-- Map test cases to suites
INSERT INTO test_suite_cases (test_suite_id, test_case_id) VALUES
(1, 1), (1, 4), (1, 8), -- Smoke tests
(2, 1), (2, 2), (2, 3), (2, 4), (2, 5), (2, 6), (2, 7), -- Regression
(3, 1), (3, 2), -- Auth suite
(4, 8), (4, 9) -- Mobile suite
ON CONFLICT DO NOTHING;

-- Seed test executions
INSERT INTO test_executions (test_case_id, test_suite_id, executed_by, status, comments, execution_time, executed_at) VALUES
(1, 1, 3, 'Pass', 'Login worked as expected', 15, NOW() - INTERVAL '2 days'),
(1, 1, 3, 'Pass', 'All steps passed', 12, NOW() - INTERVAL '1 day'),
(2, 2, 3, 'Pass', 'Error message displayed correctly', 10, NOW() - INTERVAL '2 days'),
(3, 2, 3, 'Fail', 'Cart count not updating', 20, NOW() - INTERVAL '2 days'),
(4, 1, 3, 'Pass', 'Checkout completed successfully', 45, NOW() - INTERVAL '1 day'),
(5, 2, 3, 'Pass', 'Search results accurate', 8, NOW() - INTERVAL '1 day'),
(6, 2, 3, 'Fail', 'Page load time exceeded 3 seconds', 25, NOW() - INTERVAL '3 days'),
(7, 2, 3, 'Pass', 'API returned correct product data', 5, NOW() - INTERVAL '1 day'),
(8, 1, 3, 'Pass', 'App launched successfully', 10, NOW() - INTERVAL '1 day'),
(1, 3, 3, 'Pass', 'Login successful', 14, NOW() - INTERVAL '5 hours')
ON CONFLICT DO NOTHING;

-- Seed defects from failed tests
INSERT INTO defects (test_execution_id, test_case_id, title, description, severity, status, created_by, assigned_to) VALUES
(4, 3, 'Cart count not updating after add to cart', 'When adding product to cart, the cart icon count does not increment. Need to refresh page to see update.', 'High', 'Open', 3, 2),
(7, 6, 'Product page load time exceeds performance threshold', 'Product detail page takes 3+ seconds to load. Target is under 2 seconds. Possible database query optimization needed.', 'Medium', 'In Progress', 3, 1)
ON CONFLICT DO NOTHING;
