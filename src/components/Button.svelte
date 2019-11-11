<script>
  export let type = "fill";
  export let size = "default";
  export let color = "primary";
</script>

<style lang="scss" type="text/scss">
  @import "../scss/variables";

  button {
    border-radius: 10px;
    padding: 10px 14px;
    font-weight: 600;
    border: none;
    transition: 0.2s;
  }

  button.default {
    padding: 10px 14px;
    font-size: 12px;
  }

  button.small {
    padding: 6px 18px;
    font-size: 11px;
  }

  button.fill {
    color: $color-white;
    border: none;
    @each $name, $color in $colors {
      &.#{$name} {
        background-color: $color;
        &:hover {
          background-color: rgba($color, 0.9);
        }
        &:active {
          background-color: darken($color, 10%);
        }
      }
    }
  }

  button.no-outline {
    background-color: $color-white;

    border: none;

    @each $name, $color in $colors {
      &.#{$name} {
        color: $color;
      }
    }

    &:hover {
      background-color: darken($color-white, 5%);
    }
    &:active {
      background-color: darken($color-white, 10%);
    }
  }

  button.outline {
    background-color: transparent;

    @each $name, $color in $colors {
      &.#{$name} {
        color: $color;
        border: 1px solid rgba($color, 0.5);
        &:hover {
          background-color: rgba($color, 0.05);
          border: 1px solid rgba($color, 0.75);
        }
        &:active {
          background-color: rgba($color, 0.1);
          border: 1px solid $color;
        }
      }
    }
  }
</style>

<button
  class:fill={type == 'fill'}
  class:no-outline={type == 'no-outline'}
  class:outline={type == 'outline'}
  class:default={size == 'default'}
  class:small={size == 'small'}
  class:primary={color == 'primary'}
  class:secondary={color == 'secondary'}
  class:error={color == 'error'}
  on:click>
  <slot />
</button>
