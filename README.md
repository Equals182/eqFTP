eqFTP
=====

FTP integration for Brackets code editor.

This extension brings simple FTP support to Brackets.
Here's some features:

* FTP File Manager -- You can explore remote server
* Downloading -- On double click you can download file to edit
* Uploading -- You can upload files on save
* FTP Connection Manager -- You can manage all your connections in single window

This extension created on base of https://github.com/theproducer/brackets-ftp. Actually I rewrote almost everything, but still.

## Please Note

This extenstion supports data encryption. To enable this feature check it in settings dialog. [Click here for more information](https://github.com/Equals182/eqFTP/wiki/Setting-Up#start).

## Current State

This extension inspired by Dreamweaver's FTP implementation. First you create new connection in manager, next you connect, download file, edit, save and it's uploads automatically.

It's really basic and I hope you'll enjoy this extension. [Click here for more information](https://github.com/Equals182/eqFTP/wiki)

## What's Next

Well first of all I'd like to say I did this extension because I needed it. I will add new features if I'll need them or if you will pull request them.

You can fork this stuff and change it however you want.

I'm thinking about this:

* SFTP -- well, this feature is dead now
* Sync -- down/uploading whole things in both ways
* Queue -- you will be able to save bunch of files and then - BAM! Upload them!
* Folder Choosing Dialog for every input that needs it
* Multi-language support
* More UI integration
* Open only readable by Brackets extensions
* Refreshing whole file tree
* Auto-moving all projects from old default directory to new
* Creating, deleting and renaming files on remote server
* FTP panel resizing

## Known Issues

* Unstable downloaded files opening

## Version History

* 1.0.1
 * Added encrypting settings file option.
* 1.0.0
 * Initial release.

## License

MIT-licensed -- see main.js for details.
