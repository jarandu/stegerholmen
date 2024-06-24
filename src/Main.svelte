<script>

import { onMount } from 'svelte';
import { gql } from './utils';
import { writable } from 'svelte/store';
import Loader from './Loader.svelte';
import Sales from './Sales.svelte';

let products = {
  'Dryck': [],
  'Mat': [],
  'Glass': [],
  'Godis': [],
};
let sales = [];
let cartText = '';
let showCartText = false;
let checkoutWaiting = false;

const cart = writable([]);

const createSale = async (soldItems, paymentMethod, fullfilled = 'true') => {
  checkoutWaiting = true;
  const sum =  $cart.reduce((acc, curr) => {
        return acc + curr.product.price * curr.quantity;
      }, 0);
  let cartItems = [];
  for (const item of soldItems) {
    if (item.quantity > 1) {
      Array.from({length: item.quantity}).forEach(() => {
        cartItems.push(`{price: ${item.product.price}, product: {connect: {id: "${item.product.id}"}}}`)
      });
    }
    else cartItems.push(`{price: ${item.product.price}, product: {connect: {id: "${item.product.id}"}}}`)
  }
  const sale = await gql(`
    mutation CreateSale {
      createSale( 
        data: {
          fullfilled: ${fullfilled}, 
          paymentMethod: ${paymentMethod}, 
          sum: ${sum}, 
          time: "${new Date().toISOString()}", 
          soldItems: {
            create: [
              ${cartItems.join(' ')}
            ]
          }
          text: ${cartText}
        }
      ) {
        id
      }
    }`);
  if (sale) {
    cart.set([]);
    getSales();
    checkoutWaiting = false;
  }
};

const getProducts = async () => {
  const productsData = await gql(`
    query GetProducts {
      products(orderBy: name_ASC, first: 100) {
        id
        name
        price
        slug
        category
      }
    }`);
  const productsByCategory = productsData.products.reduce((acc, curr) => {
    let cat = curr.category;
    if (cat == 'Godis') cat = 'Mat';
    if (!acc[cat]) {
      acc[cat] = [];
    }
    acc[cat].push(curr);
    return acc;
  }, {});
  products = productsByCategory;
}
const getSales = async () => {
  const salesData = await gql(`
    query GetSales {
      sales(orderBy: time_DESC, first: 100) {
        soldItems {
          price
          product {
            id
            name
          }
        }
        paymentMethod
        text
        sum
        time
        id
      }
    }`);
  sales = salesData.sales;
}

const addToCard = (product) => {
  if (product.name == 'Godis') {
    if ($cart.find(i => i.product.name == 'Godis')) return;
    const price = prompt("Angi pris");
    if (!price) return;
    cart.update(items => {
      items.push({ product: {...product, price}, quantity: 1 });
      return items;
    });
  }
  else {
    cart.update(items => {
      const item = items.find(i => i.product.id === product.id);
      if (item) {
        item.quantity++;
      } else {
        items.push({ product, quantity: 1 });
      }
      return items;
    });
  }
}

onMount(async () => {
  getProducts();
  getSales();
});

$: console.log($cart);

</script>

{#if $cart.length}
<div class="cart">
  <h3>Handlekurv</h3>
  <ul>
    {#each $cart as { product, quantity }, i}
      <li>
        <div class="name">
          {product.name} ({product.price} kr)
        </div>
        <div class="quantity">
          {quantity}
        </div>
        <button class="remove" on:click={() => {
          cart.update(items => {
            const item = items.find(i => i.product.id === product.id);
            if (item.quantity > 1) {
              item.quantity--;
            } else {
              items = items.filter(i => i.product.id !== product.id);
            }
            return items;
          });
        }}>
          <svg viewBox="0 0 10 10" stroke="white" stroke-width="1" stroke-linecap="round">
            <path d="M1 5 L9 5" />
          </svg>  
        </button>
      </li>
    {/each}
  </ul>
  <div class="sum">
    <div>Totalt</div>
    <div>{$cart.reduce((acc, curr) => {
    return acc + curr.product.price * curr.quantity;
  }, 0)} kr</div>
  </div>
  {#if showCartText}
  <textarea bind:value={cartText} placeholder="Kommentar"></textarea>
  {:else}
  <button class="add-text" on:click={() => showCartText = true}>Legg til kommentar</button>
  {/if}
  {#if !checkoutWaiting}
  <div class="fullfillment-buttons">
    <button class="swish" on:click={() => {
      createSale($cart, 'Swish');
    }}>Swish</button>
    <button class="cash" on:click={() => {
      createSale($cart, 'Cash');
    }}>Cash</button>
    <button class="vipps" on:click={() => {
      createSale($cart, 'Vipps');
    }}>Vipps</button>
  </div>
  {:else}
  <div class="checkout-waiting">
    <Loader />
  </div>
  {/if}
</div>
{/if}

<div class="products">
{#if products.Glass.length === 0}
<div class="products-loading">
  Laster produkter...
  <Loader />
</div>
{:else}
  <div class="products-categories">
    {#each Object.keys(products) as category}
      <div class="product-category {category}">
        <h3>{category}</h3>
        <ul>
          {#each products[category] as product}
            <li>
              <img src="./images/{product.slug}.jpg" alt="" />
              <div class="product-info">
                <h4>{product.name}</h4>
                {product.price} kr
              </div>
              <button on:click={() => addToCard(product)}>
                <svg viewBox="0 0 10 10" stroke="white" stroke-width="1" stroke-linecap="round">
                  <path d="M5 1 L5 9 M1 5 L9 5" />
                </svg>
              </button>
            </li>
          {/each}
        </ul>
      </div>
    {/each}
  </div>
{/if}
</div>  

{#if sales.length}
  <Sales {sales} />
{/if}

<style>

  .products-loading {
    padding: 1.6rem 1.2rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .product-category {
    padding: 1.6rem 1.2rem;
    background: var(--background);
  }
  .products ul {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr));
    gap: 1rem;
  }
  .products li {
    position: relative;
    display: flex;
    background: white;
    flex-direction: column;
    gap: 0.3rem;
    justify-content: flex-end;
    box-shadow: 5px 5px 0 0 var(--shadow);
    padding: 1rem;
    aspect-ratio: 1/1;
    border-radius: 10px;
    overflow: hidden;
  }
  .products img {
    position: absolute;
    width: calc(100% - 2rem);
    height: calc(100% - 2rem);
    object-fit: cover;
  }
  .product-info {
    z-index: 1;
  }
  .products button {
    position: absolute;
    bottom: 1rem;
    right: 1rem;
    width: 1.2rem;
    height: 1.2rem;
    border-radius: 3px;
    background: rgb(2, 74, 2);
    z-index: 2;
  }
  .cart {
    position: fixed;
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
    bottom: 0;
    right: 2rem;
    background: white;
    padding: 2rem;
    box-shadow: 0 0 15px 0 rgba(0, 0, 0, 0.10);
    border-radius: 15px 15px 0 0;
    width: 380px;
    transition: 0.5s ease;
    z-index: 100;
  }
  .cart h3 {
    margin: 0;
  }
  .cart ul {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .cart li {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .cart .name {
    flex: 1;
  }
  .cart .remove {
    width: 1rem;
    height: 1rem;
    border-radius: 3px;
    background: rgb(159, 44, 5);
  }
  .cart .sum {
    display: flex;
    justify-content: space-between;
    font-weight: bold;
    font-size: 1.1rem;
  }
  .cart .add-text {
    all: unset;
    cursor: pointer;
    text-decoration: underline;
  }
  .cart textarea {
    padding: 0.5rem;
    resize: none;
  }
  .cart .fullfillment-buttons {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
    margin-top: 0.5rem;
  }
  .fullfillment-buttons button {
    padding: 1rem;
    border: none;
    background: #333;
    color: white;
    border-radius: 5px;
  }
  .checkout-waiting {
    height: 5.5rem;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  button.swish {
    grid-column: span 2;
    background: #28903f;
    color: white;
  }
  button.vipps {
    background: #ff5b24;
    color: white;
  }

  @media (max-width: 480px) {
    .cart {
      width: 100%;
      left: 0;
      right: 0;
    }
  }
</style>