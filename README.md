eqFTP
=====

### [Important thing you need to know after *updating* from 0.2.5- to 0.2.6+ version](https://github.com/Equals182/eqFTP/wiki/1.5-Troubleshooting#i-just-updated-to-new-version-and-all-my-saved-settings-are-gone-now)

### [Help with translations!](https://github.com/Equals182/eqFTP/wiki/1.6-Frequently-Asked-Questions#how-can-i-translate-this-extension-to-language-of-my-people)

FTP integration for Brackets code editor.

This extension brings simple FTP support to Brackets.
Here's some features:

* FTP File Manager -- You can explore remote server
* Downloading -- On double click you can download file to edit
* Uploading -- You can upload files on save
* FTP Connection Manager -- You can manage all your connections in single window
* Queue -- You can queue lots of files and then upload them with one click.

This extension created on base of [Brackets FTP](https://github.com/theproducer/brackets-ftp). Actually I rewrote almost everything, but still. 

Inspired by Dreamweaver's FTP implementation. First you create new connection in manager, next you connect, download file, edit, save and it's uploads automatically.

It's really basic and I hope you'll enjoy this extension. [Click here for more information](https://github.com/Equals182/eqFTP/wiki)

## Please Note

This extenstion supports data encryption. To enable this feature check it in settings dialog. [Click here for more information](https://github.com/Equals182/eqFTP/wiki/1.1.-Setting-Up#store-passwords-safely).

**This extension is SO fresh so please use it carefully, and if you find a bug [create an issue now](https://github.com/Equals182/eqFTP/issues/new)**

## What's Next

Well first of all I'd like to say I did this extension because I needed it. I will add new features if I'll need them or if you will pull request them.

You can fork this stuff and change it however you want.

I'm thinking about this:

* SFTP -- well, this feature is dead now
* Sync -- like REAL sync (gotta figure it out)
* More UI integration
* Open only readable by Brackets files (extension)
* Auto-moving all projects from old default directory to new
* Creating, deleting and renaming files on remote server
* FTP panel resizing

## Some Links

- [Known Issues](https://github.com/Equals182/eqFTP/issues?state=open)
- [Troubleshooting](https://github.com/Equals182/eqFTP/wiki/1.5-Troubleshooting)
- [FAQ](https://github.com/Equals182/eqFTP/wiki/1.6-Frequently-Asked-Questions)

## Version History

>Please don't kick my ass for updating extension so often. I just want to fix every bug that was found.
>
>If I fix something critical I throw update on registry and for that I need to increase version number (I'm trying to follow [Semantic Versioning](http://semver.org/)). If update is too minor and it's not critical enough for extension work, I'll just wait till it get bigger or till weekends.

* 0.3.0 (5/16/14)
 * Multilaguage Support (Contribute with translating!)
* 0.2.7 (5/18/14)
 * Correct remote root recognition
 * Better error handling. It's not crushing now. Wow.
 * Minor but still important bugfixes
* 0.2.1-0.2.6 (5/12/14) 
 * Fixing the bug with .eqFTP-note file
 * Fixing files downloading bug
 * Changed default projects folder
 * Changed default settings folder
* 0.2.0 (5/11/14)
 * Improved queueing (should work faster)
 * Directory downloading in both ways
 * Code refactoring
* 0.1.0 (5/10/14)
 * Added progress bar for queue
 * Lots of queue improvements
 * Better errors handling
 * Checking filesize before trying opening it
* 0.0.3 (5/4/14)
 * Added queue
 * Removed deprecated methods
 * Added context menu on right click on files in remote browser
 * New menu items in context menu in project files
 * Context menu for queue panel
 * Folder opening dialog for input fields which needs it
* 0.0.2 (4/27/14)
 * Added encrypting settings file option.
* 0.0.1 (4/20/14)
 * Initial release.

## License

MIT-licensed -- see main.js for details.

## Voluntary Donations

This extension is totally free to use or edit because of license but if you **really** have tons of money and want to throw some dollars at me -- you're welcome! Use button below to give me moneyz for my work!

[![Donate! :3](https://pp.vk.me/c617327/v617327212/806b/DPUcVE7PTRQ.jpg)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=XNJ33D53AR9JJ)
