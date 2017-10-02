![hi_score][_0A]
[![Coverage Status](https://coveralls.io/repos/github/mmikowski/hi_score/badge.svg?branch=master)](https://coveralls.io/github/mmikowski/hi_score?branch=master)

*A modern full-lifecycle starter project for SPAs*

---
## Overview
**`hi_score`** is a full-lifecycle starter project for web application client development. It embodies best (or at least pretty-darn-good) practices accumulated from over 20 years of continuous web development experience for every stage of deveplment. **`hi_score`** embraces the feature-module (or "web component") design pattern, so it should work well with React or Vue.js projects.  Please do swap assets and libraries as required - [that's the point][_01].

## Recent changes (2017-10-01)
### Version 1.4.x (2017-10-01)
- Add Typebomb2 example application
- Add patch for font-awesome css
- More robust libraries
- Fix various bugs
(TODO) update virtual appliance image


### Version 1.3.x (2017-09-09)
- Add virtual appliance for ease of setup
- Add universal `xhi` lifecycle managment tool
- All configuration now in `package.json`
- Most tools move to NodeJS

The `xhi` tool guides developers through lifecycle stages and employs sophisticated dependency checking to help avoid mistakes

---
## Quick start
Installation is trivial once the [development environment](#development-platform) is ready. Just open a terminal and paste three lines:

```bash
  git clone git@github.com:mmikowski/hi_score.git
  cd hi_score
  bin/xhi build,dev_start
  google-chrome http://localhost:8080/build/latest/dist
```

The `xhi build,dev_start` command installs vendor assets; copies, configures, and patches vendor files for development; configures and starts an HTTP server; lints code with ESLint and other checkes, lists TODO items for developer review; runs all regression test suites in `test.d`; calculates and reports test coverage; minimizes, obsfucates, and packages a distribution with a unique build number containing multiple applications.

There are now three example applications to inspect. Two (`app-ex01.html` and `app-ex02.html`) are
simple applications that use the default libraries. Typebomb2 is the latest addition and it is far from trivial.

We encourage you to use the Chrome developer tools to inspect the CSS, the DOM, and the JavaScript. Notice how CSS classes are obsfucated and namespaced.

---
## Key benefits
**`hi_score`** solves lots of hard stuff out-of-the-box so we can focus on improving things that really matter, like the JavaScript, HTML, CSS and application logic.:

- Automated full-lifecycle best practice with the `xhi` tool
- Integration with GIT and NPM lifecycles
- Fully managed vendor assets including SCMS controlled patching,
  deployment, packaging, and distribution
- Vendor assets include JavaScript, CSS, Fonts, Images, and others
- Development web server (WIP HTTPS and HTTP/2)
- TDD with JSDOM, drop directory and code coverage reports
- Linting (ESLint, whitespace check, strict check, TODO check)
- Automatic install of comprehensive commit-hook
- Battle-tested `xhi` libraries with 99% coverage of core utilities
- Automatic namespacing and run-time control of CSS using [PowerCSS][_11]
- All code written to a consistent [standard][_04]
- Type safety using [type-casting][_05]
- Integrated browsable HTML documentation using markdown and `pandoc`
- Two simple example applications
- Placeholders for future lifecycle phases
- Compression and shuffling of property key symbols
- One-touch make ensures dozens of prequisites and tests pass and then
  creates a unique build id with pristine distribution directory, metadata,
  and coverage reports.

---
## The xhi tool
The `xhi` tool automates best practice for almost every conceivable stage of the SPA development life cycle. All configuration in the NPM `package.json` file.

The `xhi` tool resolves goal and environment prerequisites so we won't forget to run a necessary stage to attain a desired goal. For example, if we run 'xhi build' right after cloning the Github repository, it will run all the stages needed to ensure a quality build including *installation of the npm librares*. If we run it again, many stages will be omitted because they aren't needed again. If we run `dev_upgrade` all the `npm` packages be updated to the latest revision the system will do the right thing and re-install our `npm` packages, re-setup the environment, and re-test the codebase. See the [Run Lifecycle Stages section](#run-lifecycle-stages) below for more detail.

The full-lifecycle stages supported by `xhi` are shown below. Those marked 1.4.x are placeholder which will be addressed in the next major release.
```
  $ xhi help all
    xhi>  START Stage 00 help
    xhi>  00 help        : Help on 'xhi' tool, use -v for verbose
    xhi>  01 install     : Download and install npm modules
    xhi>  02 setup       : Patch and distribute vendor npm assets
    xhi>  03 design      : Show architecture docs
    xhi>  04 dev_pull    : Download and merge SCMS assets (git pull)
    xhi>  05 dev_upgrade : Upgrade packages to latest
    xhi>  06 dev_start   : Start local HTTP server
    xhi>  07 dev_test    : Run regression tests
    xhi>  08 dev_lint    : Lint changed code
    xhi>  09 dev_cover   : Create coverage report
    xhi>  10 dev_commit  : Commit changes with git
    xhi>  11 build       : Build a distribution
    xhi>  12 publish     : Upload to publishers
    xhi>  13 dev_restart : Cycle local HTTP server
    xhi>  14 dev_stop    : Stop local HTTP server
    xhi>  15 deploy      : Upload distribution        1.4.x
    xhi>  16 prod_start  : Start production server(s) 1.4.x
    xhi>  17 prod_restart: Cycle production server(s) 1.4.x
    xhi>  18 prod_stop   : Stop production server(s)  1.4.x
    xhi>  19 fetch_info  : Fetch feedback             1.4.x
    xhi>  20 uninstall   : Remove xhi                 1.4.x
    xhi>  END Stage 00 help
```

We use `xhi` for all [NPM lifecycle scripts][_38] (such as `npm test`).

### Get help
The `xhi` tool help is detailed and extensive. We have deleted many sections of this document because the information is now directly integrated. One can see detailed help on a stage or range of stages by including a `-v` flag as shown below.

```
  $ bin/xhi help dev_lint -v
  xhi>  START Stage 00 help
  xhi>  08 dev_lint: 
  xhi>    Check lint quality of changed JS code.
  xhi>    Files in 'vendor|node_modules' directories are ignored.
  xhi>    Four tests are performed on each file:
  xhi>      1. Check for tab characters or trailing space
  xhi>      2. Ensure 'use strict'; is employed
  xhi>      3. Run 'eslint' on each file (config in package.json)
  xhi>      4. List TODO items for developer to review and approve
  xhi>    Any failed step causes this stage to report failure.
  xhi>    
  xhi>    This stage does not "short-circuit" so any and all issues are
  xhi>    shown for each run.
  xhi>
  xhi>    NPM SCRIPTS      : none.
  xhi>    SUCCESS CRITERIA : All tests complete without error
  xhi>  END   Stage 00 help
```

### Run lifecycle stages
A typical workflow is shown below.

```
  # Get list of stages
  $ xhi help all

  # Run desired stage-range
  $ xhi dev_cover,build
```

The `xhi` tool takes a `<stage-range>` argument. Stages that are provided out-of-order are sorted before running. Example use is shown below.

```
  # Run a single stage
  $ xhi install

  # Run all stages between 'install' and 'dev_commit' inclusive
  $ xhi install-dev_commit

  # Run individual stages
  $ xhi update,dev_cover

  # Run a range using stage numbers
  $ xhi 0-5

  # Get help on ranges
  $ xhi help install -v
  $ xhi help install-dev_commit
  $ xhi update,dev_cover
  $ xhi help 0-5
```

The `xhi` tool will often run more than one stage even when we specify just one. That is because many stage require prequisite as discussed in the following section.

### Prerequisite resolution
The `xhi` has a sophisticated prerequisite resolver that ensures required stages are run only if required.

#### Goal prerequisites
Goal prerequisites are stages that are always run before before the target stage. For example, if we run `xhi dev_commit` the `dev_lint`, and `dev_test` stages will be run first to ensure the code quality is acceptable. If either prerequisite fails, `xhi` exits immediately (with an exit code of 1) and the target stage is not attempted. Goal prequesites are configuired in `package.json.xhi_commandTable`.

#### Environment prequisites
These are stages that must be successfuly completed in the development environment. For example, if we run `xhi dev_commit` but have not run `xhi install`, the `install` stage will be run before the `dev_commit` stage. The success or failure of each stage is saved in the state file (`lib/xhi_state.json`) and the next stage is run. If the `install` stage succeeds it will not be included in future prerequisite calculations.

Environment prerequisites may be invalidated. For example, if `xhi install` or `xhi upgrade` fail, the tool will mark the `install` stage as failed and this will be attempted again in the next `xhi` invocation that require it as a prerequisite.

Explicitly requested stages will run again regardless of their last success statuses. For example, `xhi dev_lint` may or may not run the `install` stage, but `xhi install,dev_lint` will *always* run the `install` stage because it is explicitly listed. `xhi help-dev_lint` will also run `install` since it is explicitly within the range provided. We can reset the status by removing the `stage_status_map` from the `lib/xhi_state.json` file.

### Exit status
If all the stages of a range are successful an exit status of `0` is provided. If any stage fails  processing of the range stops and an exit status of `1` is provided. In Bash, the return status is available in the `$?` environment variable.

---
## Feature-module architecture
Please see `xhi design` for an overview of the architecture we've been advocating since 2011. We ecourge developer to create feature modules that contain their own isolated data and models when appropriate. This is pragmatic, recognizes the fractal nature of MVC, and is compatible with recent libraries such as React and Vue.

---
## Code Style
We use the code style presented in [Single Page Web Applications - JavaScript end-to-end][_00] (see reviews on [Amazon][_02]) in the upcoming 2nd editions. The [quick reference][_03] and the [full code standard][_04] are available are included in the `docs` directory.

---
## Browser compatibility
Our baseline compatibility is IE9+. Those supporting IE 8 have our sympathy.

---
## Deployment platform
The server component of **hi\_score** is designed to run on industry-standard hardware, cloud instances like Amazon EC2, and containers. Our server platform is Ubuntu 16.04 LTS. Later version of Ubuntu and other distributions should work well.

---
## Development platform
### Appliance
An appliance is recommended for MacOS or Windows users. Download [the OVA2 image][_39] and install on VirtualBox or download [the VMX manifest][_40] and [the VMDK image][_41] to install on Parallels or VMware.

### Ubuntu Linux
Everything should just work on recent Ubuntu 16.04+ and derivatives like Mint or Kubuntu. The steps to install all required and recommended libraries are shown below.

```
  # install development and useful libs
  sudo wajig install apt-file build-essential git \
    htop kdiff3 libfile-slurp-perl \
    liblist-moreutils-perl meld mysql-client mysql-server \
    net-tools openssh-server pandoc pandoc-citeproc \
    ppa-purge sysstat unzip vim-gtk vim-nox \
    vim-syntax-gtk zip

  # Install nodejs
  curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
  sudo apt-get install -y nodejs

  # Install MongoDB 3.x
  # See their website for details.
```

### Other Linux
Other Linux distributions should generally work as long as the same libraries can be installed with Ubuntu. It works fine on current versions of CentOS. Development libraries should be installed as shown below.

```
  $ yum install gcc gcc-c++ make openssl-devel
```

See [this guide][_06] for NodeJS package installation on other Linux distros. Here is a more [generic guide][_07] for Kubuntu and Ubuntu.

### Mac
The easiest way path to get familiar with this project on Mac is probably to use a product like Parallels or VMFusion and import a [VMX manifest][_40] and the [VMDK][_41] disk. VirtualBox also runs on Mac but it doesn't integrate as well to the host OS as Parallels, for example.

We should be able to run this natively on the Mac but we haven't tested it.  We would need at the very least Bash 4+, [GNU Core utilities][_08], NodeJS, Git, PanDoc, Perl File::Slurp, and SSH server.

### Windows
We recommend using a virtual machine as detailed above.

---
## Vendor assets
The `xhi setup` stage patches and deploys vendor assets using the `xhi_02_SetupMatrix` configuration found in the `package.json` file. This field is correlated with the with the `devDependencies` map to ensure assets are properly label, patched, distributed, and ignored by GIT.

Assets are copied to their destination directory with their version number appended to their names. The `.gitignore` file instructs `git` to ignore all these files as their development management is external to our project. **Everytime `xhi setup` is run the vendor directories are deleted and recreated**.

### Executable assets
Vendor executables are copied to the `bin/vendor` directory.

### Font assets
Vendor font files are copied to the `font/vendor` directory. These fonts are currently installed:

- [Font Awesome][_30]: Icon fonts
- [Open Sans][_31]: OSS Font face

### Image assets
Vendor images are be copied to the `img/vendor` directory.

### JavaScript assets
#### Client JS libraries
Client libraries are copied to the `js/vendor` directory. This makes them available to the web server. The following libraries are installed:

- [jQuery][_10]: DOM manipulation
- [PowerCSS][_11]: JS-powered CSS
- [jQuery Plugin: event.dragscroll][_12]: Inertia scroll
- [jQuery Plugin: event.gevent][_13]: Global events
- [jQuery Plugin: event.ue][_14]: Touch and desktop gestures
- [jQuery Plugin: scrolli][_15]: Scroll indicators
- [jQuery Plugin: urianchor][_16]: SPA routing
- [SprintF][_32]: Sprintf library
- [TaffyDB][_17]: Client data management

#### Node JS libraries
NodeJS libraries are **not** copied to a `vendor` directory. We may changes this if we decide to create a server distribution. The following libraries are installed:

- [clusterjs][_34]: Server multiplexer
- [express][_36]: Minimalist Sinatra HTTP server
- [mongodb][_34]: Official mongodb node client
- [mysql2][_35]: Faster mysql interface
- [websocket][_37]: Websockets interface

#### Development JS libraries
Developent libraries are used for testing a building code. They **are** not copied to a `vendor` directory and probably never will be as they are for development, not deployment. The following libraries are installed:

- [coveralls][_18]: Code coverage reporting
- [istanbul][_19]: Code coverage
- [jsdom][_20]: DOM mock for testing
- [eslint][_21]: Linting for xhi, commit hook
- [nodeunit][_22]: Unit testing
- [node-inspector][_23]: Debugging
- [uglifycss][_24]: CSS minification
- [uglifyjs][_25]: JS minification
- buildify: Build script

### Styling assets
Vendor CSS libraries are copied to the `css/vendor` directory. We copy the Font Awesome CSS files to this directory:

- [Font Awesome][_30]: Icon fonts

### Patches
The `xhi_02_SetupMatrix.patch_matrix` directs patch application.

The `xhi setup` stage applies patches to vendor assets. The configuration for patches are in `package.json` in the `xhiPatchMatrix` map. The patches are stored in the `patch` directory.

The patches mechanism allows us to use great tools tweaked for our needs while maintaining the upstream source. For example, we patch `uglify-js` to support object property name compression and shuffling by `superpack`.

---
## Build
Use `xhi build` or `xhi make` or `xhi 11` (where 11 is the stage number) to build a distribution. The build script concatenates, compresses, and obsufucates JavaScript and CSS. It copies only the required assets into the the distribution directory (`build/<build_id>/dist`). The result loads faster, runs faster, and typically consumes <5% of the disk space of the development code.

```
  $ ## Show disk usage of all development files
  $ cd hi_score && export PATH=`pwd`/bin:$PATH;
  $ du -sh .
    148M

  $ ## Get disk usage of all distribution files
  $ xhi build && cd build/latest && du -sh .
    3.6M
```

The `xhi build` stage uses uses `superpack` to analyze symbols (variable names, object properties, and labels) and replaces them with shortened and shuffled keys. The shortest keys are used for the most frequently found symbols. `superpack` reports the key-to-symbol mapping and the frequency of use which makes further optimizations by pruning code easier (see `build/<build-number>/stage/<name>.diag` for mapping and key use). Projects with many object properities can be compressed an additional 50% using `superpack` and hinder reverse-engineering of the compressed code.

The build process enhances security because only a tiny, currated, obsfucated portion of our code is published and sensitive data such as SCMS metadata, documentation, lookup-maps, and development assets are omitted for us to publish elsewhere at our discretion. The distribution also reduces the dozens of HTTP calls to just a few. This can reduce load time significantly as illustrated below.

| Attribute   | Original (%)     | Minified (%)     | Superpack (%)    |
|-------------|-----------------:|-----------------:|-----------------:|
| Size        | 601,027 (100.0%) | 215,400 ( 35.8%) | 162,494 ( 27.1%) |
| Gzipped     | 151,716 ( 25.2%) |  62,895 ( 10.4%) |  57,275 ( 09.5%) |

| Attribute   | Original         | Minified (%)     | Superpack (%)    |
|-------------|-----------------:|-----------------:|-----------------:|
| HTTP reqs   |      27 (100.0%) |       4 ( 15.4%) |       4 ( 15.4%) |
| Local ms    |     231 (100.0%) |     166 ( 71.2%) |     144 ( 62.3%) |
| Deploy Size |           121 MB |    8 MB (  6.6%) |    8 MB (  6.5%) |

The load time measurements were made using a local HTTP server which is almost certainly a best-case scenario. We hope to add results for a remote server soon.

---
## Namespaces
Namespaces enable us to provide a suite of web apps that share a great deal of code but have instances and data cleanly isolated. Namespacing across JS and CSS can help one trace behaviors to the controlling code faster and with greater accuracy. We can open them in google-chrome (`xhi install && google-chrome ex*.html`) to see this in practice.

When we view Example 1 (`ex01.html`) we can open the browser development tools (press `<shift>-<ctrl>-i` or `<shift>-<cmd>-i` on a Mac), type `ex01` into the JavaScript console and press `<return>` to inspect that value. We can see that thisw single variable that contains our entire application. When we enter `ex02` we see that it is `undefined`. When we visit the Example 2 (`ex02.html`) instead we can see that `ex01` is `undefined` and `ex02` contains our app code using a similar process.

We also namespace our CSS classes to avoid collisions. When we inspect the HTML of the Example 1 app we can see that nearly all classes start with an `ex01-` prefix. When we inspect Example 2 tab we find the prefix is `ex02-`. As with the JavaScript namespacing, the prefixes are hierarchical. For example, the `ex02-_lb_` class was generated for use by the `ex02-_lb_` module.

## Contribute
Any improvements or suggestions are welcome through the [issues tracker][_29]. Pull requests are especially appreciated.

## Release Notes
### Copyright (c)
2016, 2017 Michael S. Mikowski (mike[dot]mikowski[at]gmail[dotcom])

### License
MIT

### Version 0.0.x
- (x) Initial preparation

### Version 0.1.x
- (x) Library updates

### Version 0.2.x
- (x) Regression and integration testing
- (x) Rudimentary sample app

### Version 0.3.x
- (x) Add code coverage
- (x) Replace `getDeepMapVal` and `setDeepMapVal` with more powerful and tested `getStructData` and `setStructData`
- (x) Updates to `xhi/01_util.js`

### Version 0.4.x
- (x) Replace `jscoverage` with much more complete and recent `istanbul`
- (x) Added `cast` routines and detail their use
- (x) Consolidate utilities to increase coverage
- (x) Update lite-box using `cast` methods

### Version 0.5.x
- (x) Add `jsdom` to expand testing to modules that use jQuery
- (x) Continue regression test expansion
- (x) Rationalize libraries
- (x) Add lite-box regression tests

### Version 0.6.x
- (x) Remove vendor code from repo and auto-copy on install
- (x) Add native utils `makeThrottleFn` and `makeDebounceFn`
- (x) Add links to updated code style guides
- (x) Replace `install` script with `prep-libs` (v0.6.17+)

### Version 0.7.x
- (x) Move to consturctor approach to easily create multiple
   concurrent namespaced apps using the common xhi core
- (x) Update index page to illustrate
- (x) Make example app less trivial
- (x) Number code library level

### Version 0.8.x
- (x) Work on build system
- (x) Unify shell scripts nomenclature
- (x) Add constructor where only selected components are added
- (x) Add dependency levels for xhi libs

### Version 0.9.x
- (x) Add distribution build system `npm run buildify`
- (x) Add utilities and tests

### Version 1.0.x
- (x) Initial feature complete
- (x) Add utils and tests

### Version 1.1.x
- (x) Rename `npm run prep-libs` to `npm run setup`
- (x) Rename `npm run cover`     to `npm run coverage`
- (x) Rename `npm run covera`    to `npm run publish-coverage`
- (x) Rename `npm run buildify`  to `npm run make`
- (x) Syntax refinements
- (x) Update libs, add express
- (x) Add utils and tests

### Version 1.2.x
- (x) Convert bin/setup in JavaScript
- (x) Configure setup completely in package.json

### Version 1.3.x
- (o) Update code standard quick-reference
- (x) Replace JSLint with ESLint for ES2015 support
- (x) Convert from `var` => `let`
- (x) Implement `xhi` tool development capabilities
  - (o) 12 publish      : Implement push to coveralls
  - (o) 13 dev\_restart : Implement dev server restart
  - (x) 00 xhi help
  - (x) 01 install
  - (x) 02 setup
  - (x) 03 design
  - (x) 04 dev\_pull
  - (x) 05 dev\_upgrade
  - (x) 06 dev\_start
  - (x) 07 dev\_test
  - (x) 08 dev\_lint
  - (x) 09 dev\_cover
  - (x) 10 dev\_commit
  - (x) 11 build
  - (x) 14 dev\_stop
- (x) Tool enhancements
  - (x) `xhi setup`     : Implement env prequisites and `lib/xhi_state.json`
  - (x) `xhi setup`     : Auto-create `lib/xhi_state.json` if required
  - (x) `xhi build`     : Create build directory like `dist/\<build-number\>`
  - (x) `xhi build`     : Link `dist/latest` to latest build
  - (x) `xhi build`     : Do not auto-increment build until next commit
  - (x) `xhi dev_cover` : Move to `dist/\<build-number\>` directories
- (x) Update all NPM lifecycle scripts to use `xhi` 
  - (x)"help" : "bin/xhi help",
  - (x)"make" : "bin/xhi make",
  - (x)"setup": "bin/xhi setup",
  - (x)"test" : "bin/xhi test",
  - (x)"xhi"  : "bin/xhi"
- (x) Move build manifest to `package.json`
- (x) Implement build numbers and link last build to `latest`
- (x) Move coverage reports into build directories
- (x) Store build and env state in `lib/xhi_state.json`
- (x) Create and update virtualBox [OVA for development][_39]
- (x) Create and update Parallels [VMX][_40] and [VMDK][_41]
- (x) Replace jslint setting from per-file to config/jslint.conf
- (x) Expect browser env for js/xhi libraries
- (x) Fix 01_util.js > makeSeriesMap method cross timezones
- (x) Update code standard
    
### Version 1.4.x
- (x) Create AMI image for deployment
- (x) Introduce and refine typebomb2 as example app

### Version 1.5.x (next)
- (o) Test load times using remote server
- (o) `xhi` tools enhancements
  - (o) `xhi dev_start, prod_start` HTTPS : Use LetsEncrypt to use HTTPS by default
  - (o) `xhi dev_start, prod_start` HTTP/2: Configure for HTTP/2 if feasible
  - (o) `xhi build` convert: buildify Bash to JS, use `package.json` config
  - (o) `xhi build` convert: superpack Perl to JS, use `package.json` config
  - (o) `xhi deploy` implement: Add configuration and capability
  - (o) `xhi publish` : Push to NPM
---
## Similar Projects
[absurd.js][_26], [responsive.js][_27]

## End

[_0A]:img/hi_score.png
[_00]:https://www.manning.com/books/single-page-web-applications
[_01]:http://mmikowski.github.io/no-frameworks
[_02]:http://www.amazon.com/dp/1617290750
[_04]:https://github.com/mmikowski/hi_score/blob/master/doc/js-code-standard.adoc
[_05]:http://mmikowski.github.io/type-casts/
[_06]:https://nodejs.org/en/download/package-manager/
[_07]:https://docs.google.com/spreadsheets/d/1kLIYKYRsan_nvqGSZF-xJNxMkivH7uNdd6F-xY0hAUM/edit#gid=598969125
[_08]:https://www.topbug.net/blog/2013/04/14/install-and-use-gnu-command-line-tools-in-mac-os-x/
[_09]:https://coveralls.io/github/mmikowski/hi_score
[_10]:http://jquery.org
[_11]:http://powercss.org
[_12]:https://www.npmjs.com/package/jquery.event.dragscroll
[_13]:https://www.npmjs.com/package/jquery.event.gevent
[_14]:https://www.npmjs.com/package/jquery.event.ue
[_15]:https://www.npmjs.com/package/jquery.scrolli
[_16]:https://www.npmjs.com/package/jquery.urianchor
[_17]:https://www.npmjs.com/package/taffydb
[_18]:https://www.npmjs.com/package/coveralls
[_19]:https://www.npmjs.com/package/istanbul
[_20]:https://www.npmjs.com/package/jsdom
[_21]:https://www.npmjs.com/package/eslint
[_22]:https://www.npmjs.com/package/nodeunit
[_23]:https://www.npmjs.com/package/node-inspector
[_24]:https://www.npmjs.com/package/uglifycss
[_25]:https://www.npmjs.com/package/uglifyjs
[_26]:http://absurdjs.com/
[_27]:http://www.responsivejs.com/
[_28]:https://github.com/mmikowski/hi_score
[_29]:https://github.com/mmikowski/hi_score/issues
[_30]:https://www.npmjs.com/package/font-awesome
[_31]:https://www.npmjs.com/package/open-sans-fontface
[_32]:https://www.npmjs.com/package/sprintf-js
[_33]:https://www.npmjs.com/package/mysql2
[_34]:https://www.npmjs.com/package/mongodb
[_35]:https://www.npmjs.com/package/clusterjs
[_36]:https://www.npmjs.com/package/express
[_37]:https://www.npmjs.com/package/websocket
[_38]:https://docs.npmjs.com/misc/scripts
[_39]:http://michaelmikowski.com/ova/kubuntu-17.04-hi_score-001-ova2.ova
[_40]:http://michaelmikowski.com/ova/kubuntu-17.04-hi_score-001.vmx
[_41]:http://michaelmikowski.com/ova/kubuntu-17.04-hi_score-001-disk1.zip

