# babel-plugin-react-element-classes

This plugin is a proof of concept for getting `elementClasses` to behave similarly to how they work in metal-jsx. This plugin is not intended for production use.

If you do want to try this out, add this file to your project and add the filepath to your babel config for plugins and make sure you haven't run the `element-classes` tranform.

package.json

```json
{
	"babel": {
		"plugins": ["./babel-plugin-react-element-classes"]
	}
}
```
