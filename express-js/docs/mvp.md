# MVP DEVELOPMENT PROMPT: STOCKROOM – PRODUCT INVENTORY MANAGER

## 1. Project Overview

Build a simple Product Inventory Management System called **Stockroom** using Express.js.

The purpose of this project is to demonstrate practical knowledge of Express.js and browser APIs through a working application with a clean, modern interface.

The application should allow users to manage products, monitor inventory, search and filter records, and mark products as favorites.

This is a learning project, so prioritize clean code, understandable implementation, proper project structure, and practical use of Express.js concepts.

Do not overengineer the application.

---

## 2. Technology Stack

### Backend
- Node.js
- Express.js
- JavaScript using CommonJS (`require`)
- In-memory JavaScript array for product storage

### Frontend
- HTML5
- CSS3
- Vanilla JavaScript
- Fetch API

### Browser APIs (Required)

Implement at least these two browser APIs:

**1. Web Storage API**
- Use `localStorage` to save favorite product IDs.
- Favorites must remain available after refreshing the browser.
- Allow users to add and remove favorites.

**2. Constraint Validation API**
- Use native HTML form validation.
- Use attributes such as `required`, `min`, `step`, and `pattern` where appropriate.
- Use JavaScript methods such as `checkValidity()` and `reportValidity()`.
- Prevent invalid product submissions.

### Package Manager
- Use **pnpm exclusively**.
- Do not use npm or Yarn.
- Generate and maintain `pnpm-lock.yaml`.
- Do not generate `package-lock.json` or `yarn.lock`.

---

## 3. Core Features

### A. Dashboard

Create a dashboard showing inventory statistics.

Display the following summary cards:

- Total Products
- Total Inventory Units
- Low Stock Products
- Out of Stock Products

Calculate these values dynamically based on the current product records.

Suggested stock classifications:
- In Stock: quantity greater than 5
- Low Stock: quantity from 1 to 5
- Out of Stock: quantity equal to 0

### B. Product Management

Users must be able to perform basic CRUD operations.

**Create Product**
- Add a new product.
- Validate all required fields.
- Prevent duplicate SKUs.
- Automatically generate a unique product ID.

**Read Products**
- Display products in a table.
- Show product details and stock status.

**Update Product**
- Edit existing product information.
- Load existing values into the form.
- Save changes through the API.

**Delete Product**
- Allow users to delete products.
- Show a confirmation before deletion.

### C. Search and Filtering

Implement:
- Search by product name or SKU.
- Filter by category.
- Filter by stock status.
- Clear filters.

Search and filtering should update the product table without requiring a full page reload.

### D. Favorites

Allow users to mark products as favorites.

Requirements:
- Add or remove a product from favorites.
- Display a favorite indicator.
- Provide a filter to show favorite products only.
- Persist favorite IDs using `localStorage`.
- Handle deleted products gracefully by removing invalid favorite IDs.

### E. Stock Status

Show a visual status indicator for each product:

- In Stock
- Low Stock
- Out of Stock

The status must update automatically when product quantities change.

---

## 4. Express.js Backend Requirements

Implement the following API endpoints:

| Method | Endpoint | Description |
|---|---|---|
| GET | `/products` | Retrieve all products |
| GET | `/products/:id` | Retrieve one product |
| POST | `/products` | Create a product |
| PUT | `/products/:id` | Update a product |
| DELETE | `/products/:id` | Delete a product |

### API Behavior

**GET /products**
- Return all products.
- Support optional query parameters:
  - `search`: search by name or SKU.
  - `category`: filter by category.
  - `status`: filter by stock status.
- Return a JSON response.

**GET /products/:id**
- Return the requested product.
- Return HTTP 404 if the product does not exist.

**POST /products**
- Accept product information through a JSON request body.
- Validate required fields and data types.
- Prevent duplicate SKUs.
- Return HTTP 201 when successfully created.
- Return HTTP 400 for invalid input.

**PUT /products/:id**
- Update an existing product.
- Validate submitted information.
- Prevent duplicate SKUs belonging to other products.
- Return HTTP 404 if the product does not exist.

**DELETE /products/:id**
- Delete an existing product.
- Return an appropriate success response.
- Return HTTP 404 if the product does not exist.

### Product Data Structure

Each product should contain:

```json
{
  "id": "unique-id",
  "name": "Wireless Mouse",
  "sku": "ACC-001",
  "category": "Accessories",
  "price": 599.00,
  "quantity": 25
}
```

Use at least five sample products when the application starts.

Use appropriate data types:
- `id`: string
- `name`: string
- `sku`: string
- `category`: string
- `price`: number
- `quantity`: integer

### API Response Format

Use consistent JSON responses.

Successful response example:

```json
{
  "success": true,
  "data": {
    "id": "unique-id",
    "name": "Wireless Mouse"
  }
}
```

Error response example:

```json
{
  "success": false,
  "message": "Product not found"
}
```

For product collections, return the product array inside `data`.

---

## 5. Express.js Concepts to Demonstrate

The implementation must demonstrate practical use of the following Express.js features:

1. **Express Application**
   - Initialize an Express application.
   - Configure the server port.
   - Start the HTTP server.

2. **Middleware**
   - Use `express.json()` to parse JSON request bodies.
   - Use `express.urlencoded()` to parse URL-encoded request bodies.
   - Use `express.static()` to serve frontend files.
   - Implement a custom request logging middleware.

3. **Routing**
   - Use `express.Router()` to organize product routes.
   - Register routes using `app.use()`.
   - Use HTTP methods such as GET, POST, PUT, and DELETE.

4. **Request Parameters**
   - Use `req.params` to retrieve product IDs.
   - Use `req.query` to retrieve search and filter parameters.
   - Use `req.body` to retrieve submitted product information.

5. **Error Handling**
   - Implement centralized error-handling middleware.
   - Return appropriate HTTP status codes.
   - Avoid exposing unnecessary internal error details to clients.

6. **REST API Design**
   - Use appropriate HTTP methods.
   - Return JSON responses.
   - Keep API routes organized and consistent.

---

## 6. Frontend Requirements

Build the frontend using plain HTML, CSS, and JavaScript.

Do not use React, Vue, Nuxt, Angular, Bootstrap, or other frontend frameworks.

### Dashboard Layout

Create a clean SaaS-style inventory dashboard.

The interface should include:

**Sidebar**
- Stockroom logo or application name.
- Dashboard navigation.
- Products navigation.
- Favorites navigation.

**Main Content**
- Page title and short description.
- Summary statistic cards.
- Search and filter controls.
- Product table.
- Add Product button.

### Product Table

Display the following columns:

- Product Name
- SKU
- Category
- Price
- Quantity
- Stock Status
- Favorite
- Actions

Actions should include:
- Edit
- Delete

### Product Form

Use a modal or a dedicated form section for adding and editing products.

Fields:
- Product Name
- SKU
- Category
- Price
- Quantity

Requirements:
- Show required field indicators.
- Validate inputs before submission.
- Display useful validation feedback.
- Reuse the same form for creating and editing products.

### User Feedback

Implement:
- Success toast notifications.
- Error notifications.
- Delete confirmation.
- Loading indicators.
- Empty states when no products are available.
- Error states when API requests fail.

### Design Direction

Use a minimal, modern SaaS dashboard aesthetic.

Suggested design:
- White or light-gray background.
- Purple as the primary accent color.
- Subtle borders and shadows.
- Rounded cards and buttons.
- Clean typography.
- Consistent spacing.
- Responsive layout for desktop, tablet, and mobile.

Avoid excessive animations and unnecessary visual elements.

---

## 7. Frontend API Integration

Use the browser Fetch API to communicate with the Express backend.

Examples of required operations:

- Fetch products when the dashboard loads.
- Submit new products using POST.
- Update products using PUT.
- Delete products using DELETE.
- Refresh the displayed data after successful operations.

Do not hardcode the product table in the HTML.

All product records must be retrieved from the Express API.

Use asynchronous JavaScript with `async/await` and handle request errors properly.

Search and filtering may use the API query parameters instead of filtering only on the frontend.

---

## 8. Project Structure

Use the following structure:

```text
stockroom/
├── app.js
├── package.json
├── pnpm-lock.yaml
├── README.md
│
├── middleware/
│   └── requestLogger.js
│
├── routes/
│   └── products.js
│
├── public/
│   ├── index.html
│   │
│   ├── css/
│   │   └── style.css
│   │
│   └── js/
│       └── app.js
│
└── postman/
    └── Stockroom.postman_collection.json
```

Keep the implementation simple. Do not create unnecessary folders or abstractions.

---

## 9. Package Configuration

Use pnpm for all dependency management and project commands.

Required dependencies:

- `express`
- `nodemon` (development dependency)

Example `package.json`:

```json
{
  "name": "stockroom",
  "version": "1.0.0",
  "description": "Express.js Product Inventory Manager MVP",
  "main": "app.js",
  "scripts": {
    "start": "node app.js",
    "dev": "nodemon app.js"
  },
  "dependencies": {
    "express": "^5.1.0"
  },
  "devDependencies": {
    "nodemon": "^3.1.0"
  }
}
```

Use compatible dependency versions and generate the actual lockfile through pnpm.

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

### Start

```bash
pnpm start
```

Do not use npm or Yarn commands in the README, scripts, or implementation instructions.

---

## 10. Postman Collection

Create an importable Postman collection at:

`postman/Stockroom.postman_collection.json`

Include requests for:

1. Get all products.
2. Get product by ID.
3. Create a product.
4. Update a product.
5. Delete a product.
6. Search products.
7. Filter products by category.
8. Filter products by stock status.

Use a collection variable for the base URL:

`http://localhost:3000`

Provide example request bodies and expected response descriptions.

The collection should be importable into Postman without requiring manual reconstruction.

---

## 11. README Documentation

Create a clear README.md containing:

### Project Overview
Explain what Stockroom does and its purpose.

### Technology Stack
List the backend, frontend, browser APIs, and package manager.

### Prerequisites
- Node.js
- pnpm

### Installation

```bash
pnpm install
```

### Running the Application

Development:

```bash
pnpm dev
```

Normal start:

```bash
pnpm start
```

### Application Access

`http://localhost:3000`

### API Documentation
Document every endpoint, HTTP method, request parameters, sample request bodies, and response formats.

### Browser API Implementation
Explain how the application uses:
- Web Storage API.
- Constraint Validation API.

### Project Structure
Briefly explain the purpose of the main files and folders.

### Postman Testing
Explain how to import and use the included collection.

### Known Limitations
Clearly mention that products are stored in memory and will reset when the server restarts. Favorites are stored in the browser's localStorage.

---

## 12. Implementation Rules

Follow these rules throughout development:

1. Keep the application focused on the MVP.
2. Use readable and maintainable JavaScript.
3. Use CommonJS modules for the backend.
4. Separate product routes and middleware from `app.js`.
5. Use proper HTTP status codes.
6. Validate incoming API data on the server, not only in the browser.
7. Do not trust frontend validation alone.
8. Use `localStorage` only for favorites, not as the main product database.
9. Keep product data in the backend's in-memory array.
10. Do not add a database.
11. Do not use a frontend framework.
12. Do not introduce authentication or user accounts.
13. Do not add unnecessary third-party libraries.
14. Do not use npm or Yarn. Use pnpm exclusively.
15. Do not create unnecessary abstractions or overcomplicate the implementation.

---

## 13. Acceptance Criteria

The MVP is considered complete when:

- [ ] The Express server starts successfully.
- [ ] The frontend is served through Express.
- [ ] At least five sample products are available.
- [ ] Users can view all products.
- [ ] Users can add products.
- [ ] Users can edit products.
- [ ] Users can delete products.
- [ ] Users can search products.
- [ ] Users can filter products by category and stock status.
- [ ] Dashboard statistics update correctly.
- [ ] Users can mark products as favorites.
- [ ] Favorites persist after browser refresh.
- [ ] HTML Constraint Validation API is implemented.
- [ ] Server-side validation is implemented.
- [ ] All required REST API endpoints work.
- [ ] Custom request logging middleware works.
- [ ] Centralized error handling is implemented.
- [ ] Postman collection is included and importable.
- [ ] README contains complete setup and usage instructions.
- [ ] `pnpm install` works from a clean checkout.
- [ ] `pnpm-lock.yaml` is included.
- [ ] No npm or Yarn lockfiles are generated.

---

## 14. Final Development Instructions

Build the complete working MVP, not just a static UI or code samples.

Before considering the project complete:

1. Install dependencies using pnpm.
2. Run the application.
3. Verify all CRUD operations.
4. Verify search and filtering.
5. Verify favorites persist after refreshing the browser.
6. Test form validation.
7. Test API error responses.
8. Verify the Postman collection.
9. Check the browser console and server terminal for errors.
10. Ensure the README accurately reflects the actual implementation.

If possible, run automated tests for the API and validation logic. Do not claim that a feature or test works unless you have actually verified it.

**Final Goal:** Deliver a functional, responsive Product Inventory Management System that demonstrates practical Express.js backend development and at least two browser APIs, using pnpm as the only package manager.
