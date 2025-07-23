<script>
  import { onMount } from 'svelte';
  import Loader from './Loader.svelte';
  import { fetchSales, getProducts, fetchSoldItems } from './utils';
  import PieChart from './PieChart.svelte';

  let sales = [];
  let products = [];
  let soldItems = [];

  const getDatesArray = (startDate, endDate) => {
    const dateArray = [];
    let currentDate = startDate;
    while (currentDate <= endDate) {
      dateArray.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dateArray;
  }

  $: salesPerDay = sales.length > 0 ? sales.reduce((acc, curr) => {
    const date = new Date(curr.time).toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = 0;
    }
    acc[date] += curr.sum;
    return acc;
  }, {}) : {};

  $: max = Object.keys(salesPerDay).length > 0 ? Math.max(...Object.values(salesPerDay)) : 0;

  $: days = getDatesArray(new Date('2025-07-15'), new Date('2025-08-15')).map((date) => {
    return {
      date,
      sum: salesPerDay[date.toISOString().split('T')[0]] || 0,
    }
  });

  $: today = sales.filter(sale => new Date(sale.time).toISOString().split('T')[0] === new Date().toISOString().split('T')[0]);

  $: todayAmount = today.reduce((acc, curr) => {
    return acc + curr.sum;
  }, 0);

  $: totalAmount = sales.reduce((acc, curr) => {
    return acc + curr.sum;
  }, 0);

  const getSalesWithItems = (sales, soldItems, count = Infinity) => {
    // @ts-ignore
    const x = sales.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, count);
    return x.map(sale => {
      return {
        ...sale,
        soldItems: soldItems.filter(item => item.sale_id === sale.id).map(item => {
          const product = products.find(product => product.id === item.product_id);
          return {
            ...item,
            name: product.name,
            category: product.category,
          }
        })
      }
    });
  }

  $: todaysSales = getSalesWithItems(today, soldItems);

  $: todaysSoldItems = todaysSales.flatMap(sale => sale.soldItems);

  const categoriesColors = {
    'Dryck': '#e9a700',
    'Glass': '#006671',
    'Mat': '#950454',
    'Godis': 'rgb(209 71 71)',
  }

  const getSummary = (soldItems) => {
    const categoriesWithProfitMargin = {
      'Dryck': 0.67,
      'Glass': 0.3,
      'Mat': 0.5,
      'Godis': 0.25
    }
    return soldItems.reduce((acc, curr) => {
      if (!acc[curr.category]) {
        acc[curr.category] = {
          sum: 0,
          count: 0,
        };
      }
      acc[curr.category].sum += curr.price * categoriesWithProfitMargin[curr.category];
      acc[curr.category].count += 1;
      return acc;
    }, {});
  }

  $: todaysSummary = getSummary(todaysSoldItems);
  $: todaysTotalProfit = Object.values(todaysSummary).reduce((acc, curr) => {
    return acc + curr.sum;
  }, 0);

  $: pieData = todaysSummary ? Object.entries(categoriesColors).map(([category, color]) => {
    if (!todaysSummary[category]) return null;
    return {
      label: category,
      value: todaysSummary[category].sum,
      color,
    }
  }).filter(Boolean) : [];

  const getPaymentMethods = (sales) => { 
    return sales.reduce((acc, curr) => {
      if (!acc[curr.payment_method]) {
        acc[curr.payment_method] = 0;
      }
      acc[curr.payment_method] += curr.sum;
      return acc;
    }, {});
  };

  onMount(async () => {
    [sales, products, soldItems] = await Promise.all([
      fetchSales(),
      getProducts(), // Call the new getProducts function
      fetchSoldItems()
    ]);
  });

</script>

{#if sales.length === 0}
  <div class="loader-container">
    <Loader />
  </div>
{:else if sales.length > 0}
  <div class="sales">
      <h2>I dag</h2>
      <div class="sales-info">
        <div class="cards">
          <div class="card">
            <div class="amount">
              {todayAmount.toLocaleString('nb-NO')}<span class="unit">kr</span>
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
            <div class="amount">
              {todaysTotalProfit.toLocaleString('nb-NO', {
                maximumFractionDigits: 0,
              })}<span class="unit">kr</span>
            </div>
            Estimert fortjeneste
          </div>
          <div class="card">
            <PieChart data={pieData} />
          </div>
        </div>
      </div>
      <h2>Totalt</h2>
      <div class="sales-info">
        <div class="cards">
          <div class="card">
            <div class="amount">
              {totalAmount.toLocaleString('nb-NO')}<span class="unit">kr</span>
            </div>  
            <div>
              {#each Object.entries(getPaymentMethods(sales)) as [method, sum]}
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
          <!-- <div class="card">
            {#each Object.entries(getProductsPerCategory(sales)) as [category, amount]}
              <div><strong>{category}</strong>: {amount}</div>
            {/each}
          </div> -->
        </div>
      </div>
      <h2>Salg per dag</h2>
      {#if days.length > 0 && max > 0}
        <div class="chart">
          <div class="y-axis">
            <div class="tick" style="bottom: 0">0</div>
            {#each Array.from({length: Math.floor(max / 1000)}, (_, i) => i + 1) as i}
              <div class="tick" style="bottom: {i * 1000 / max * 100}%">
                {(i * 1000).toLocaleString('nb-NO')}
              </div>
            {/each}
          </div>
          <div class="bars">
          {#each days as {date, sum}}
            <div class="bar" style="height: {sum / max * 100}%;" title="{sum} kr">
              <div class="label">{new Date(date).getDate()}</div>
            </div>
          {/each}
          </div>
        </div>
      {/if}
      <h2>Siste ti salg</h2>
      <ul class="receipts">
        {#each todaysSales.slice(0, 10) as sale}
          <li class="receipt">
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
                  {soldItem.name}
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
      <!-- <h3>Per produkt</h3>
      <ul class="products">
        {#each products as [product, amount], i}
          <li>
            {i + 1}. {product} ({amount})
          </li>
        {/each}
      </ul> -->
  </div>
{/if}

<style>
  .loader-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
  }
  .sales {
    padding: 0 1.2rem 1.6rem;
  }
  h2 {
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
    box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
    border-radius: 0.5rem;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
  }
  .card .amount {
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
  }
  .unit {
    font-weight: 100;
    margin-left: 0.25rem;
  }
  .chart {
    position: relative;
    height: 200px;
    margin-bottom: 3rem;
  }
  .bars {
    padding-left: 2rem;
    display: flex;
    align-items: end;
    gap: 2px;
    height: 100%;
  }
  .bar {
    flex: 1;
    background: #333;
    min-height: 1px;
    position: relative;
    border-top-left-radius: 3px;
    border-top-right-radius: 3px;
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
    left: 0;
    top: 0;
    bottom: 0;
    width: 100%;
  }
  .tick {
    position: absolute;
    width: 100%;
    border-bottom: 1px solid #ccc;
    font-size: 0.65rem;
    color: #666;
  }
  .receipts {
    list-style: none;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
  }
  .receipt {
    width: fit-content;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    background: #f7f3e9;
    padding: 0.75rem 1rem;
    border-radius: 1px;
  }
  .sold-items {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .payment {
    margin-top: auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .products {
    list-style: none;
    padding: 0;
  }
  .products li {
    padding: 0.25rem 0;
  }

  @media (max-width: 480px) {
    .receipts, .cards {
      display: grid;
      grid-template-columns: 1fr 1fr;
    }
    .receipt {
      width: unset;
    }
  }
</style>