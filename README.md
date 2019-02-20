# Metal to React

This repo is a proof of concept to see how difficult is to migrate from metal-jsx to react.

Tested on:
`macOS: v10.12.6`
`node: v11.8.0`
`npm: v6.5.0`

## What do the transforms do?

The goal is for the [jscodeshift](https://github.com/facebook/jscodeshift) transforms to do ~90% of the work. The remaining 10% is likely specific application code that can't be converted 1-to-1 from metal to react.

**Note:** If you are using [decorators](https://babeljs.io/docs/en/babel-plugin-proposal-decorators) in your code base, you will need to install and run [this branch](https://github.com/bryceosterhaus/jscodeshift/tree/decoratorsPlugin) for jscodeshift to work properly.

## How to use Transforms

1. Run all transforms on codebase. `node ${TRANSFORMS_DIR}/all.js` in the directory you want to run the transforms against.
2. Install new dependencies, `npm i --save react react-dom react-redux && npm i --save-dev babel-preset-react`
3. Update babel config, remove `metal-jsx` preset and add `react` preset.
    - You may also need `babel-polyfill` installed and specified in your webpack config.
4. Now you can try to build your app and work out any errors that happen in the build process
5. Once you get your app building successfully, you'll need to manually handle errors you see in your browser.
    - A large set of errors will likely be due to Router, try to swap in a new router early in migration.
6. Now you'll need to go through work through all of the `METAL_JSX_CODE_MOD:` comments manually.
7. Finally, once you get all the errors figured out, its best to run whatever formatter you want to ensure code cleanliness. I personally prefer [prettier](https://github.com/prettier/prettier).

## Migration Pain Points(after running transforms)

1. Need to manually go through and migrate to new Router framework.
    - Likely either [react-router](https://github.com/ReactTraining/react-router) or [reach-router](https://github.com/reach/router)
2. `elementClasses` is unique in metal-jsx and is used quite a bit. Manually migrating to adding className for each component is time consuming.
    - POSSIBLE_SOLUTION: Use [element-classes](./transforms/element-classes.js) transform to manually add `this.props.elementClasses` to every component and slowly migrate away from this. (this is the route I chose to use.)
    - POSSIBLE_SOLUTION: Create a babel plugin to make elementClasses behave like they do in metal-jsx. See [babel-plugin-react-element-classes](./babel/babel-plugin-react-element-classes.js)
3. Non 1-for-1 lifecycles need to be manually addressed.
    - `detached`, `disposed`, and `willReceiveState` all get `FIXME_` appended to their name so we can easily address them.
    - `willAttach`, `willReceiveProps`, `willUpdate` have 1-for-1 equivalents but they are soon to be deprecated and considered [unsafe](https://reactjs.org/blog/2018/03/29/react-v-16-3.html#component-lifecycle-changes).
    - All `sync{PROP_NAME}` methods must also be manually migrated. Using either `getDerivedStateFromProps` or `UNSAFE_componentWillReceiveProps` from react.
4. Any 3rd party metal-jsx package needs to be removed and migrated over.
    - POSSIBLE_SOLUTION: Create some sort of bridge component that allows use of metal-jsx inside of react. [Codesandbox Example](https://codesandbox.io/s/2zwj4oo49j)
5. The [context API is much different in react](https://reactjs.org/blog/2018/03/29/react-v-16-3.html#official-context-api), this requires manual migration to the new context API.
    - POSSIBLE_SOLUTION: Create a simple guide for what that migration would look like.
6. Fixing any `style` attributes on jsx requires manual migration to using [react's format for style](https://reactjs.org/docs/dom-elements.html#style)
    - POSSIBLE_SOLUTION: We might be able to come up with a transform to do this.
7. Not all `Config` API is supported. Such as `setter`, `valueFn`, `validator`, `inRange`, `writeOnly` and `internal`.
    - For now, we just remove all of these via tranforms.
8. `this.otherProps()` works slightly differently than `...this.props`. This can introduce bugs if you don't explicitly omit certain props.
   For example...

Metal

```js
class MetalApp extends Metal.Component {
	static PROPS = {
		foo: Config.value('bar')
	};
	render() {
		return <div {...this.otherProps()} />;
	}
}

<MetalApp someCoolProp="baz" />;
// <div someCoolProp="baz" />
```

React

```js
//React
class ReactApp extends React.Component {
	defaultProps = {
		foo: 'bar'
	};
	render() {
		return <div {...this.props} />;
	}
}

<ReactApp someCoolProp="baz" />;
// <div someCoolProp="baz" foo="bar" />
```
