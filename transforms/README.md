# Transforms

### Running all

To run all these transforms, simply run `node ${TRANSFORMS_DIR}/all.js` in the directory you want to run the transforms against.

### Running individually

`jscodeshift '.' -t ${TRANSFORMS_DIR}/element-classes.js --parser babel`
