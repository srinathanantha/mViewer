mViewer(Micro/Mongo Viewer) is a light web-based GUI for managing MongoDB without needing any installation.
mViewer allows managing databases, collections, gridfs, users & indexes as an alternative to the mongoDB native shell
in a simpler and user-friendly way.

## mViewer-v0.9.2 - Beta 
  
### Whats new in mViewer-v0.9.2 ?
   1. Enhanced Query Executor with support for executing queries on databases & collections including Map Reduce & aggregation queries.
   2. Enhanced command spotlight with better keyboard navigation even to menu items
   3. Support for managing Database users
   4. Supoort for managing Collection indexes
   5. Enhanced authentication & security with support for --auth mode
   6. Better Look-n-Feel
   
### Working with mViewer-0.9.2-beta:
   You can checkout the code or download the zip and make a release build using maven/ant as described below.
Extract the generated mViewer-0.9.2-release.zip & mViewer-0.9.2-release.tar.gz and run start_mViewer.bat/start_mViewer.sh.
 
### Raising feature requests and issues:
   You can raise feature requests and bugs found @ https://github.com/Imaginea/mViewer/issues
##### We are always eagerly waiting for your feature requests and bug reports

## mViewer-v0.9.1 - Stable Release (as on 25-08-2012)

### mViewer-v0.9.1 supports :-

   1. Managing Databases - Create/Drop databases
   2. Managing Collections - Create/Update/Drop collections
   3. Managing GridFS files - Add/View/Download/Drop files
   4. Querying for documents using Query executor
   5. Quick Navigation & Execution of all actions items using CTRL + Space.
   6. Pagination and Navigation to any subset of documents.
   7. Viewing stats of databases, collections and gridFS
   8. Opening multiple connections from same browser to different MongoDB servers

### Download mViewer-v0.9.1

Windows :- https://github.com/downloads/Imaginea/mViewer/mViewer-v0.9.1.zip

Mac/Linux :- https://github.com/downloads/Imaginea/mViewer/mViewer-v0.9.1.tar.gz

Download previous versions from https://github.com/Imaginea/mViewer/downloads
    
### Usage

Unzip/Untar the downloaded package and simply run start_mViewer.bat/start_mViewer.sh (with +x permission).

>
> \>start_mViewer.bat \<port\> in Windows
>

>
> $./start_mViewer.sh \<port\> in Mac/Linux
>

'port' is optional, if not provided default port (8080) set in properties file will be used.

Start using mViewer at http://localhost:<port>/index.html


### Documentation

Detailed documentation on mViewer features & usage can be found at http://imaginea.github.com/mViewer


## Developer Notes

### Contribute to Imaginea / mViewer !
    1) Fork Imaginea / mViewer
    2) Clone your forked mViewer repository locally
    3) We use Intellij IDEA for development. So to setup with intellij 
       a) Create mViewer as a maven project using "Import project from external module".
       b) Apply Imaginea code styles/formatting settings to avoid un-wanted diffs with spaces in pull requests.
         - Download https://github.com/downloads/Imaginea/mViewer/settings.jar and use import settings option to apply it.
         - Make sure to format the code using ctr + alt + l before committing code.
         - When committing code, if see a popup regarding different line separators used in project, 
           then click 'Leave unchanged'.        
       c) Configure a Tomcat Server locally in intellij to run/debug mViewer.
    4) You can send a pull request to mViewer master branch with your features/enhancements/fixes.
          

### Making a Release build

 Using maven:-

> $mvn -Prelease

  Using ant:-  

> $ant release

 Building a release will generate mViewer-<version>-release.zip & mViewer-<version>-release.tar.gz files in the target folder
 which has the mViewer.war bundled with winstone servlet container and start-up scripts from scripts folder. 
   
### Running Standalone 
 
 Using maven:-
> $mvn -Pserver

 Using ant:-
> $ant start

It will create mViewer.war and run it using the winstone server. 
Once started, the application can be accessed at http://localhost:port. 
Default port is 8080 which can be updated in mViewer.properties file.

### Running Unit Tests

Use the following command to run the unit tests. surefire-reports will be generated in target folder.
> $mvn install -DskipTests=false

### Deploying to Other Servlet-Containers

You can generate a distributable war file using the following commands. The war can be deployed on to tomcat 7x. 
Other server integration will be provided on demand. 

Using maven:-
> $mvn clean package

Using ant:-
> $mvn dist

Once the war is deployed go to the url http://<server-ip>:<http-port>/mViewer


##### Team Imaginea
