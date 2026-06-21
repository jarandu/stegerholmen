<script lang="ts">
  import { Router, Link, Route } from "svelte-routing";
  import Main from "./Main.svelte";
  import Sales from "./Sales.svelte";
  import Setup from "./Setup.svelte";

</script>

<Router>
  <nav>
    <Link to="/">Kasse</Link>
    <Link to="sales">Salg</Link>
    <Link to="setup">Oppsett</Link>
  </nav>
  <div>
    <Route path="/"><Main /></Route>
    <Route path="sales"><Sales /></Route>
    <Route path="setup"><Setup /></Route>
  </div>
</Router>

<style>
  nav {
    display: flex;
    gap: 1rem;
    font-size: 0.9rem;
    padding: 0.8rem 1.2rem;
    line-height: 1;
    background: #333;
    color: white;
  }
</style>