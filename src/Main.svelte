<script>

import { onMount } from 'svelte';
import { gql } from './utils';
import { writable } from 'svelte/store';

let products = {
  'Dryck': [],
  'Mat': [],
  'Glass': [],
  'Godis': [],
};
let sales = [];
let checkoutWaiting = false;

const cart = writable([]);

const createSale = async (soldItems, paymentMethod, fullfilled = 'true') => {
  checkoutWaiting = true;
  const sum =  $cart.reduce((acc, curr) => {
        return acc + curr.product.price * curr.quantity;
      }, 0);
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
              ${soldItems.map(item => `{price: ${item.product.price}, product: {connect: {id: "${item.product.id}"}}}`).join(' ')}
            ]
          }
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
    if (!acc[curr.category]) {
      acc[curr.category] = [];
    }
    acc[curr.category].push(curr);
    return acc;
  }, {});
  products = productsByCategory;
}
const getSales = async () => {
  const salesData = await gql(`
    query GetSales {
      sales(orderBy: time_DESC) {
        soldItems {
          price
          product {
            id
            name
          }
        }
        paymentMethod
        sum
        time
        id
      }
    }`);
  sales = salesData.sales;
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
          {product.name}
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
  <div class="fullfillment-buttons">
    <button class="swish" on:click={() => {
      createSale($cart, 'Swish');
    }}>Swish</button>
    <button class="cash" on:click={() => {
      createSale($cart, 'Cash');
    }}>Cash</button>
    <button class="vipps" on:click={() => {
      createSale($cart, 'Cash');
    }}>Vipps</button>
  </div>
</div>
{/if}

<div class="products">
{#if products.Glass.length === 0}
  <p>Laster inn produkter...</p>
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
              <button on:click={() => {
                cart.update(items => {
                  const item = items.find(i => i.product.id === product.id);
                  if (item) {
                    item.quantity++;
                  } else {
                    items.push({ product, quantity: 1 });
                  }
                  return items;
                });
              }}>
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

<div class="sales">
<h2>Salg</h2>
{#if sales.length === 0}
  <p>Laster inn salg...</p>
{:else}
<ul>
  {#each sales as sale}
    <li class="sale">
      <div class="timestamp">
        {new Date(sale.time).toLocaleString('nb-NO', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      })}
      </div>
      <ul class="sold-items">
        {#each sale.soldItems as soldItem}
          <li>
            {soldItem.product.name}
          </li>
        {/each}
      </ul>
      <div class="payment">
        <div>{sale.paymentMethod}</div>
        <div>{sale.sum} kr</div>
      </div>
    </li>
  {/each}
</ul>
{/if}
</div>

<style>

  .product-category {
    padding: 1.6rem 1.2rem;
    background: var(--background);
  }
  .products ul {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
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
  .sales ul {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }
  .sales li.sale {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    background: #333;
    color: white;
    padding: 1rem;
    border-radius: 10px;
  }
  .sales .timestamp {
    font-size: 0.8rem;
    font-weight: bold;
  }
  .sales ul.sold-items {
    gap: 0.2rem;
    font-size: 0.9rem;
  }
  .sales ul.sold-items li {
    list-style: disc;
    margin-left: 1rem;
  }
  .sales .payment {
    display: flex;
    justify-content: space-between;
    margin-top: auto;
  }
  .cart {
    position: fixed;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
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
  button.swish {
    grid-column: span 2;
    background: #28903f;
    color: white;
  }
  button.vipps {
    background: #ff5b24;
    color: white;
  }
</style>