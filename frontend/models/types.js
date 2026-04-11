/**
 * Frontend domain models.
 * These typedefs prepare strict contracts before backend integration.
 */

/** @typedef {'pending'|'paid'|'shipped'|'delivered'|'cancelled'} OrderStatus */

/** @typedef {{ id:string, label:string, firstName:string, lastName:string, address1:string, address2?:string, city:string, region:string, postalCode:string, country:string, phone:string }} Address */

/** @typedef {{ id:string, label:string, cardholderName:string, last4:string, expiry:string }} PaymentMethodPreview */

/** @typedef {{ id:string, url?:string, alt:string }} ProductImage */

/** @typedef {{ key:string, value:string }} ProductTechnicalSpec */

/** @typedef {{ id:string, slug:string, name:string, description:string, image?:string, priority:number, active:boolean }} Category */

/** @typedef {{ id:string, slug:string, name:string, shortDescription:string, description:string, technicalSpecifications:ProductTechnicalSpec[], categoryId:string, category?:Category, price:number, currency:'EUR', stock:number, isAvailable:boolean, isFeatured:boolean, isPriority:boolean, images:ProductImage[], createdAt:string, updatedAt:string }} Product */

/** @typedef {{ productId:string, quantity:number }} CartItem */
/** @typedef {{ items:CartItem[], subtotal:number, tax:number, promotion:number, total:number }} Cart */

/** @typedef {{ productId:string, quantity:number, unitPrice:number, total:number }} OrderLine */
/** @typedef {{ id:string, createdAt:string, status:OrderStatus, lines:OrderLine[], total:number, year:number }} Order */

/** @typedef {{ query:string, categoryId:string, minPrice:number, maxPrice:number, availableOnly:boolean }} SearchFilters */
/** @typedef {'relevance'|'price'|'createdAt'|'availability'} SearchSort */

/** @typedef {{ id:string, email:string, subject:string, message:string }} ContactMessage */
/** @typedef {{ id:string, role:'user'|'assistant', content:string, createdAt:string }} ChatMessage */

/** @typedef {{ id:string, type:'carousel'|'category-grid'|'featured-products'|'text', order:number }} HomeContentBlock */
/** @typedef {{ revenue:number, orders:number, products:number }} AdminStats */
/** @typedef {{ page:number, pageSize:number, total:number }} Pagination */
/** @typedef {{ code:string, message:string, details?:string }} ApiError */
