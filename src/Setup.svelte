<script>

  let db;
  
  let insertConfig = {
    table: 'products',
    fields: {
      name: '',
      price: 0,
      category: '',
    },
  }
  let getConfig = {
    table: 'products',
    limit: 10,
    orderby: 'price',
  }
  
  
  </script>
  
  <input type="text" id="name" placeholder="Navn" bind:value={insertConfig.fields.name}>
  <input type="text" id="category" placeholder="Kategori" bind:value={insertConfig.fields.category}>
  <input type="number" id="price" placeholder="Pris" bind:value={insertConfig.fields.price}>
  <button on:click={() => {}}>Legg til data</button>
  <select bind:value={getConfig.table}>
    <option value="products">Produkter</option>
    <option value="sales">Salg</option>
  </select>
  <button on:click={() => {}}>Hent data</button>
  
  {#if db}
    <h1>Database</h1>
    <div>
      {JSON.stringify(db)}
    </div>
  {/if}
  