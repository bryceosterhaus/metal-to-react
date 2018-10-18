# Transforms

### Running all

To run all these transforms, simply run `node ${TRANSFORMS_DIR}/all.js` in the directory you want to run the transforms against.

When running all, the transforms will run in this order.

1. `render-to-string`
1. `replace-metal-render`
1. `static-state-config`
1. `add-store-to-props`
1. `module-imports`
1. `config-to-proptypes`
1. `life-cycle-names`
1. `jsx-class-to-classname`
1. `jsx-style-attribute-comments`
1. `other-props`
1. `state-to-setstate`
1. `anchor-to-router-link` (do not run if you do not use `@reach/router`.)
1. `remove-static-state`
1. `element-classes`

### Running individually

`jscodeshift '.' -t ${TRANSFORMS_DIR}/element-classes.js --parser babel`
