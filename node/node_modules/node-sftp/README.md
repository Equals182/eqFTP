# node-sftp

Example of writing a simple file to sftp location:

```js
var sftp = require('node-sftp');
var sftp = new sftp({
		host: 'hostname',
		home: "/home/user/test",
		username: "user",
		password: "pass",
		port: "22"
	},
	function(err) {
		//Error
		if (err) throw err;

		//Success
		console.log("Connected");

		//Write sample file
		sftp.writeFile("message.txt", "Hello Node", "", function(err) {
			if (err) throw err;
			console.log("It's saved!");
		});
});
```

More info soon...
