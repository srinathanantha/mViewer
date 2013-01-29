## mViewer-v0.9.1 Released !

mViewer(Micro/Mongo Viewer) is a light web-based GUI for managing MongoDB without needing any installation.

### Enhanced Feature set of mViewer-v0.9.1 now supports :-

   1. Managing Databases - Create/Drop databases
   2. Managing Collections - Create/Update/Drop collections
   3. Managing GridFS files - Add/View/Download/Drop files
   4. Querying using Query executor
   5. Quick Navigation to all actions items, just needing to type few visible letters of the name using CTRL + Space.
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

### How to contribute to Imaginea / mViewer ?
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
          

### How to Build using maven ?

>
> $mvn clean package -DskipTests
>

   Q. Why do we skip tests ?.

   A. Because we need to configure src/test/resources/mongo.config to point to running mongod service. To let the test run.
   Once set, tests can run.
   
##### Running standalone
Run using maven. It will create a war and run it using the jetty server on a default port (Check the logs that print on your screen to spot it), you can access the service at http://localhost:8080/mViewer/

>
> $mvn -Pserver -DskipTests
>


##### Deploying to Other Servlet-Containers.

For building a distributable unit run the target distributable war. This war can be deployed on to tomcat 7x, other server integration can be provided on demand.

Once the war is deployed go to the url http://<server-ip>:<http-port>/mViewer

>
> $mvn clean package -DskipTests
>

##### Building for release

Building a release, bundles the war with winstone servlet container and scripts from scripts folder. The release zip and tgz mviewer-<version>.<type>

>
> $mvn clean package -Prelease -DskipTests
>


### How to Build using ant ?


##### Running standalone
Run build.xml using ant, target is start. It will create a war and run it using the winstone server, you can access the application at http://localhost:<port-no>. You can change the port no. in mViewer.properties file. Default port is 8080

>
> $ant start
>


##### Deploying to Other Servlet-Containers.

For building a distributable unit run the target dist, since the default target is also set as dist, just running ant should suffice. dist would create a deployable war in the staging directory, which by default is at the same level as the src folder.
This war can be deployed on to tomcat 7x, other server integration can be provided on demand.

Once the war is deployed go to the url http://<server-ip>:<http-port>/mViewer

>
> $ant dist
>

##### Building for release

Building a release, bundles the war with winstone servlet container and scripts from scripts folder. The release zip and tgz mviewer-<version>.<type>

>
> $ant release
>


##### Eagerly waiting for feature requests and bug reports
##### Team Imaginea

