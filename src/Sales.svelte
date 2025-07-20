<script>
  import Loader from './Loader.svelte';
  export let sales = [];

  const getDatesArray = (startDate, endDate) => {
    const dateArray = [];
    let currentDate = startDate;
    while (currentDate <= endDate) {
      dateArray.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dateArray;
  }

  const salesPerDay = sales.reduce((acc, curr) => {
    const date = new Date(curr.time).toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = 0;
    }
    acc[date] += curr.sum;
    return acc;
  }, {});

  const days = getDatesArray(new Date('2025-07-15'), new Date('2025-08-15')).map((date) => {
    return {
      date,
      sum: salesPerDay[date.toISOString().split('T')[0]] || 0,
    }
  });

  const paymentMethods = sales.reduce((acc, curr) => {
    if (!acc[curr.payment_method]) {
      acc[curr.payment_method] = 0;
    }
    acc[curr.payment_method] += curr.sum;
    return acc;
  }, {});

  const getProductsPerCategory = (sales) => {
    console.log(sales);
    return sales.reduce((acc, curr) => {
      for (const soldItem of curr.sold_items) {
        if (!acc[soldItem.product.category]) acc[soldItem.product.category] = 0;
        acc[soldItem.product.category] += 1;
      }
      return acc;
    }, {});
  }

  const max = Math.max(...Object.values(salesPerDay));

  const salesPerProduct = sales.reduce((acc, curr) => {
    for (const soldItem of curr.sold_items) {
      if (!acc[soldItem.product.name]) acc[soldItem.product.name] = 0;
      acc[soldItem.product.name] += 1;
    }
    return acc;
  }, {});

  const products = Object.entries(salesPerProduct).sort((a, b) => b[1] - a[1]);

  const today = sales.filter(sale => new Date(sale.time).toISOString().split('T')[0] === new Date().toISOString().split('T')[0]);
  const todayAmount = days.find(day => day.date.toISOString().split('T')[0] === new Date().toISOString().split('T')[0]);

</script>

<div class="sales">
  {#if sales.length === 0}
    <Loader />
  {:else}
    <h2>I dag</h2>
    <div class="sales-info">
      <div class="cards">
        <div class="card">
          <div class="amount">
            {todayAmount.sum.toLocaleString('nb-NO')}<span class="unit">kr</span>
          </div>
          Omsetning
        </div>
        <div class="card">
          <div class="amount">
            {today.length}
          </div>
          Antal salg
        </div>
        <div class="card">
          {#each Object.entries(getProductsPerCategory(today)) as [category, amount]}
            <div><strong>{category}</strong>: {amount}</div>
          {/each}
        </div>
      </div>
    </div>
    <h2>Totalt</h2>
    <div class="sales-info">
      <div class="cards">
        <div class="card">
          <div class="amount">
            {Object.values(paymentMethods).reduce((acc, curr) => {
              return acc + curr;
            }, 0).toLocaleString('nb-NO')}<span class="unit">kr</span>
          </div>  
          <div>
            {#each Object.entries(paymentMethods) as [method, sum]}
              <div>{method}: {sum.toLocaleString('nb-NO')} kr</div>
            {/each}
          </div>
        </div>
        <div class="card">
          <div class="amount">
            {sales.length}
          </div>  
          Antal salg
        </div>
        <div class="card">
          {#each Object.entries(getProductsPerCategory(sales)) as [category, amount]}
            <div><strong>{category}</strong>: {amount}</div>
          {/each}
        </div>
      </div>
    </div>
    <h2>Salg per dag</h2>
    <div class="chart">
      {#each days as {date, sum}}
        <div class="bar" style="height: {sum / max * 100}%;" title="{sum} kr">
          <div class="label">{new Date(date).getDate()}</div>
        </div>
      {/each}
      <div class="y-axis">
        {#each Array.from({length: Math.floor(max / 1000)}, (_, i) => i + 1) as i}
          <div class="tick" style="bottom: {i * 1000 / max * 100}%"></div>
        {/each}
      </div>
    </div>
    <h3>Siste ti salg</h3>
    <ul class="receipts">
      {#each sales.slice(0,10) as sale}
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
            {#each sale.sold_items as soldItem}
              <li>
                {soldItem.product.name}
              </li>
            {/each}
          </ul>
          <div class="payment">
            <div>{sale.payment_method}</div>
            <div>{sale.sum} kr</div>
          </div>
        </li>
      {/each}
    </ul>
    <h3>Per produkt</h3>
    <ul class="products">
      {#each products as [product, amount], i}
        <li>
          {i + 1}. {product} ({amount})
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .sales {
    padding: 1.6rem 1.2rem;
  }
  h3 {
    margin-top: 2rem;
  }
  .sales-info {
    margin-bottom: 1.5rem;
  }
  .cards {
    display: flex;
    gap: 1.5rem;
  }
  .card {
    padding: 1rem;
    box-shadow: 0 1px 10px 0 rgba(0, 0, 0, 0.15);
    border-radius: 3px;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
  .card .amount {
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
  }
  .unit {
    font-size: 0.8rem;
    font-weight: normal;
  }
  .chart {
    position: relative;
    height: 200px;
    display: flex;
    align-items: end;
    gap: 2px;
    margin-bottom: 2rem;
  }
  .bar {
    flex: 1;
    background: #333;
    min-height: 1px;
    position: relative;
  }
  .label {
    position: absolute;
    bottom: -20px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 0.8rem;
  }
  .y-axis {
    position: absolute;
    left: -30px;
    top: 0;
    bottom: 0;
    width: 30px;
  }
  .tick {
    position: absolute;
    width: 100%;
    height: 1px;
    background: #ccc;
  }
  .receipts {
    list-style: none;
    padding: 0;
  }
  .sale {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid #eee;
  }
  .sold-items {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .payment {
    text-align: right;
  }
  .products {
    list-style: none;
    padding: 0;
  }
  .products li {
    padding: 0.25rem 0;
  }
</style>