eqFTP
=====

FTP integration for Brackets code editor.

This extension brings simple FTP support to Brackets.
Here's some features:

* FTP File Manager -- You can explore remote server
* Downloading -- On double click you can download file to edit
* Uploading -- You can upload files on save
* FTP Connection Manager -- You can manage all your connections in single window
* Queue -- You can queue lot's of files and then upload them with one click. It also allows to develop directory uploading and syncronisation in future 

This extension created on base of https://github.com/theproducer/brackets-ftp. Actually I rewrote almost everything, but still. 

Inspired by Dreamweaver's FTP implementation. First you create new connection in manager, next you connect, download file, edit, save and it's uploads automatically.

It's really basic and I hope you'll enjoy this extension. [Click here for more information](https://github.com/Equals182/eqFTP/wiki)

## Please Note

This extenstion supports data encryption. To enable this feature check it in settings dialog. [Click here for more information](https://github.com/Equals182/eqFTP/wiki/Setting-Up#start).

**This extension is SO fresh so please use it carefully, and if you find a bug [tweet me @Equals182](https://twitter.com/Equals182)**

## What's Next

Well first of all I'd like to say I did this extension because I needed it. I will add new features if I'll need them or if you will pull request them.

You can fork this stuff and change it however you want.

I'm thinking about this:

* SFTP -- well, this feature is dead now
* Sync -- down/uploading whole things in both ways
* Multi-language support
* More UI integration
* Open only readable by Brackets files (extension and size check)
* Refreshing whole file tree
* Auto-moving all projects from old default directory to new
* Creating, deleting and renaming files on remote server
* FTP panel resizing
* Progress Bar for Queue

## Known Issues

* Unstable downloaded files opening (e.g. downloading 0 byte sized file and trying to open it causes error)

## Version History

* 0.0.3 (5.4.14)
 * Added queue
 * Removed deprecated methods
 * Added context menu on right click on files in remote browser
 * New menu items in context menu in project files
 * Context menu for queue panel
 * Folder opening dialog for input fields which needs it
* 0.0.2 (4.27.14)
 * Added encrypting settings file option.
* 0.0.1 (4.20.14)
 * Initial release.

## License

MIT-licensed -- see main.js for details.

## Voluntary Donations

This extension is totally free to use or edit because of license but if you **really** have tons of money and want to throw some dollars at me -- you're welcome! Use button below to give me moneyz for my work!

[![Donate! :3](https://pp.vk.me/c617327/v617327212/806b/DPUcVE7PTRQ.jpg)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=XNJ33D53AR9JJ)
