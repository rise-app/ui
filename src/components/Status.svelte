<script>
  export let type = "primary";
</script>

<style lang="scss" type="text/scss">
  @import "../scss/variables";
  span {
    font-size: 14px;
    padding: 0.25rem .5rem;
    border-radius: 5px;
    cursor: default;
  }
  @each $key, $color in $colors {
    span.#{$key} {
      background-color: rgba($color, 0.1);
      color: $color;
      transition: 300ms;
      &:hover {
        background-color: rgba($color, 0.25);
      }
    }
  }
</style>

<span
  class:success={type == 'success'}
  class:primary={type == 'primary'}
  class:secondary={type == 'warn'}
  class:error={type == 'error'}>
  <slot />
</span>
