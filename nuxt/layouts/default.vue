<template>
  <div class="layout-root">
    <div class="stage">
      <div class="sky" aria-hidden="true" />
      <div class="orb orb-a" />
      <div class="orb orb-b" />
      <div class="orb orb-c" />
      <div class="app">
        <AppHeader />
        <main class="shell">
          <slot />
        </main>
      </div>
    </div>
    <AppTabBar />
  </div>
</template>
