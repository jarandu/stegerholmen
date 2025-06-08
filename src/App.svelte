<script>
  import { Router, Link, Route } from "svelte-routing";
  import Main from "./Main.svelte";
  import Compte from "./Compte.svelte";

</script>

<Router>
  <nav>
    <Link to="/">Kasse</Link>
    <!-- <Link to="compte">Salg</Link> -->
  </nav>
  <div>
    <Route path="/"><Main /></Route>
    <Route path="compte"><Compte /></Route>
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