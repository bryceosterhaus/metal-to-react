# metal-to-react

This repo is a proof of concept to see how difficult is to migrate from metal-jsx to react.

## Pain Points

1. Need to manually go through and migrate to new Router framework.
    - Likely either react-router or reach-router
2. `elementClasses` is unique in metal-jsx and is used quite a bit. Manually migrating to adding className for each component is time consuming.
    - POSSIBLE_SOLUTION: Use [element-classes](./transforms/element-classes.js) transform to manually add `this.props.elementClasses` to every component and slowly migrate away from this. (this is the route I chose to use.)
    - POSSIBLE_SOLUTION: Create a babel plugin to make elementClasses behave like they do in metal-jsx. See [babel-plugin-react-element-classes](./babel/babel-plugin-react-element-classes.js)
3. Non 1-for-1 lifecycles need to be addressed. `detached`, `disposed`, and `willReceiveState`
    - `willAttach`, `willReceiveProps`, `willUpdate` have 1-for-1 equivalents but they are soon to be deprecated and considered unsafe.
    - All `sync{PROP_NAME}` methods must also be manually migrated. Using either `getDerivedStateFromProps` or `UNSAFE_componentWillReceiveProps` from react.
4. Any 3rd party metal-jsx package needs to be removed and migrated over.
    - POSSIBLE_SOLUTION: Create some sort of bridge component that allows use of metal-jsx inside of react. [Codesandbox Example](https://codesandbox.io/s/2zwj4oo49j)
5. The context API is much different in react, this requires manual migration to the new context API.
    - POSSIBLE_SOLUTION: Create a simple guide for what that migration would look like.
6. Fixing any `style` attributes on jsx requires manual migration to using [react's format for style](https://reactjs.org/docs/dom-elements.html#style)
    - POSSIBLE_SOLUTION: We might be able to come up with a transform to do this.
7. Not all `Config` API is supported. Such as `setter`, `valueFn`, `validator`, `inRange`, `writeOnly` and `internal`.
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
