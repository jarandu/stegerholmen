<script>

import { onMount } from 'svelte';
import { getProducts, createSale } from './utils';
import { writable } from 'svelte/store';
import Loader from './Loader.svelte';

let products = [];
let category = null;
let cartText = '';
let showCartText = false;
let checkoutWaiting = false;

const cart = writable([]);

$: filteredProducts = category ? products.filter(product => product.category === category) : products;

const createSaleHandler = async (soldItems, paymentMethod, fullfilled = 'true') => {
  checkoutWaiting = true;
  const sum = $cart.reduce((acc, curr) => {
    return acc + curr.product.price * curr.quantity;
  }, 0);
  
  try {
    const sale = await createSale({
      sum: sum,
      paymentMethod: paymentMethod,
      soldItems: soldItems,
      text: cartText
    });
    
    if (sale) {
      cart.set([]);
      cartText = '';
      showCartText = false;
      checkoutWaiting = false;
    }
  } catch (error) {
    console.error('Error creating sale:', error);
    checkoutWaiting = false;
  }
};

const run = async () => {
  try {
    const productsData = await getProducts();
    products = productsData;
    filteredProducts = products;
  } catch (error) {
    console.error('Error fetching products:', error);
  }
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

// const expand = (category) => {
//   return () => {
//     const all = document.querySelectorAll('.product-category');
//     all.forEach(el => {
//       if (el.classList.contains('expanded') && !el.classList.contains(category)) {
//         el.classList.remove('expanded');
//       }
//     });
//     const el = document.querySelector(`.product-category.${category}`);
//     el.classList.toggle('expanded'); 
//   }
// }

// const setHeight = (node) => {
//   const ul = node.querySelector('ul');
//   node.style.setProperty('--height', ul.scrollHeight + 57 + 'px');
// }

const filter = (cat) => {
  category = cat;
}

onMount(async () => {
  run();
});

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
      createSaleHandler($cart, 'Swish');
    }}>Swish</button>
    <button class="cash" on:click={() => {
      createSaleHandler($cart, 'Cash');
    }}>Cash</button>
    <button class="vipps" on:click={() => {
      createSaleHandler($cart, 'Vipps');
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
{#if products.length === 0}
  <div class="loading">
    Laster produkter...
    <Loader />
  </div>
{:else}
<div class="products-categories">
  <button class="reset" on:click={() => filter(null)}>Alla</button>
  {#each ['Dryck', 'Mat', 'Glass'] as cat}
    <button class:active={category === cat} class={cat.toLowerCase()} on:click={() => filter(cat)}>{cat}</button>
  {/each}
</div>
    <ul>
      {#each filteredProducts as product}
        <li class="product {product.category.toLowerCase()}">
          <img src="./images/{product.slug}.jpg" alt="" />
          <div class="product-info">
            <h4>{product.name}</h4>
            {product.price} kr
          </div>
          <button on:click={() => addToCard(product)}>
            <svg viewBox="-1 -1 12 12" stroke="white" stroke-width="1" stroke-linecap="round">
              <path d="M5 1 L5 9 M1 5 L9 5" />
            </svg>
          </button>
        </li>
      {/each}
    </ul>
{/if}
</div>  

<style>
  .products {
    margin-top: 1rem;
  }
  .dryck {
    --color: #e9a700;
  }
  .mat,
  .godis {
    --color: #950454;
  }
  .glass {
    --color: #006671;
  }
  .reset {
    --color: #333;
  }
  .loading {
    padding: 1.6rem 1.2rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .products-categories {
    position: sticky;
    top: 0;
    z-index: 100;
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: white;
  }
  .products-categories button {
    all: unset;
    padding: 0.5rem 1rem;
    border-radius: 99px;
    background: white;
    color: var(--color);
    border: 1px solid var(--color);
    cursor: pointer;
  }
  .products-categories button:hover,
  .products-categories button.active {
    background: var(--color);
    color: white;
  }
  .products-categories button:hover {
    filter: brightness(1.1);
  }
  .products ul {
    padding: 1rem;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
    gap: 1rem;
    margin-bottom: 50vh;
  }
  .products li {
    position: relative;
    display: flex;
    background: white;
    flex-direction: column;
    gap: 0.3rem;
    justify-content: flex-end;
    box-shadow: 0 0 0.85rem 0 rgba(0, 0, 0, 0.15);
    padding: 1rem;
    aspect-ratio: 1/1.15;
    border-radius: 1rem;
    overflow: hidden;
  }
  .products img {
    position: absolute;
    top: 0.5rem;
    left: 50%;
    aspect-ratio: 1/1;
    transform: translateX(-50%);
    width: calc(100% - 2rem);
    object-position: center;
    object-fit: contain;
  }
  .product-info {
    z-index: 1;
    margin-top: 0.5rem;
  }
  .products li button {
    position: absolute;
    bottom: 1rem;
    right: 1rem;
    width: 1.35rem;
    height: 1.35rem;
    border-radius: 99px;
    background: var(--color);
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
    border-radius: 99px;
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
    border-radius: 0.75rem;
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