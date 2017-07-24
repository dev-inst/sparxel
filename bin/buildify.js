#!/usr/bin/node
/* vim: set ft=javascript: */
/*
 * buildify.js
 *
 * Synopsis : ./buildify [options]
 * Example  : $ ./buildify
 * Purpose  : Prepare a distribution using package.json as manifest.
 * Provides :
 *
 * Planned:
 *   Auto-update <script src="..."> links using xhi.util templates
 *
 * @author Michael S. Mikowski - mike.mikowski@gmail.com
*/
/*global Promise */
/*jslint         node   : true, continue : true,
 devel  : true, indent  : 2,    maxerr   : 50,
 newcap : true, nomen   : true, plusplus : true,
 regexp : true, sloppy  : true, vars     : false,
 white  : true, todo    : true, unparam  : true
*/

// == BEGIN SCRIPT setup.js ==============================================
  // == BEGIN MODULE SCOPE VARIABLES =====================================
  'use strict';
  var
    // Import capabilities
    // Add if needed: execFn = require( 'child_process' ).exec
    EventEmitter = require( 'events'       ).EventEmitter,
    LineReader   = require( 'line-by-line' ),

    applyPatchFn = require( 'apply-patch'  ).applyPatch,
    fsObj        = require( 'fs'           ),
    mkdirpFn     = require( 'mkdirp'       ),
    ncpFn        = require( 'ncp'          ).ncp,
    pathObj      = require( 'path'         ),
    rmDirFn      = require( 'rmdir'        ),
    utilObj      = require( 'util'         ),
    whichFn      = require( 'which'        ),
    promiseObj   = Promise,

    // Convert to promises using promisfy
    promisifyFn   = utilObj.promisify,
    makeRmDirProm = promisifyFn( rmDirFn ),
    makeStatProm  = promisifyFn( fsObj.stat ),
    makeWhichProm = promisifyFn( whichFn ),

    eventObj      = new EventEmitter(),

    // Assign nodejs builtins
    fqAppFilename = __filename,
    fqBinDirname  = __dirname,

    appName       = pathObj.basename( fqAppFilename, '.js' ),
    fqOrigDirname = process.cwd(), // or pathObj.resolve()
    versList      = process.versions.node.split('.'),

    // Initialize
    exePathMap  = {},
    versReqInt  = 8,
    // patchStr = '// BEGIN hi_score patch line 324',

    // Declare
    fqGitDirname,
    fqHookFilename,  fqModuleDirname,
    fqProjDirname,   fqPatchFilename,
    fqPkgFilename,   fqScopeFileStr,
    fqUglyDirname,   pkgMatrix,
    setupMatrix
    ;

  // == . END MODULE SCOPE VARIABLES =====================================

  // == BEGIN UTILITY METHODS ============================================
  function showHelpFn () {
    console.log( 'Help - WIP' );
  }

// Stages
// 000 Install
// 010 Setup (this should run make-doc)
// 020 Design and study
// 030 Develop - Lint
// 040 Develop - Test
// 050 Develop - Coverage
// 060 Develop - Commit (remove make-doc?)
// 070 Develop - Publish coverage
// 080 Build
// 090 Deploy
// 100 Feedback
//
// Name        : buildify.js
// Synopsis    : ./buildify.js [ options ]
// Description :
//   Builds a production-ready web site from manifests listed
//   in the package.json file
//   The output files are placed in build/<serial_num>
//   and the latest build is linked to build/last
//
//      build/
//        last -> build/<serial_num>
//        <serial_num>/
//          dist/
//          stage/
//
// Examples
//   package.json
//    { "devDependencies" : { "taffydb": "2.7.3", .... },
//      "xhi_010_SetupMatrix"  : {
//        "asset_group_table": [
//         { "asset_type" : "js",
//            "asset_list": [
//              {
//                "dest_name": "taffy",
//                "src_asset_name": "taffy.js",
//                "src_pkg_name": "taffydb"
//              }
//            ]
//        }
//        "dest_dir_str": "js/vendor",
//        "dest_ext_str": "js"
//      },
//      "xhiBuildTable": [
//        {
//          "build_id": "ex01",
//          "do_isolate": false,
//          "asis_make_map": {
//            "do_include_vendor": true
//          },
//          "css_make_map": {
//            "do_compress": true,
//            "do_vendor": true,
//            "target_file": "ex01.css - should be reundant"
//          },
//          "js_make_map": {
//            "asset_list": [
//              "js/xhi/00.js",
//              "js/xhi/01.util.js",
//              "js/xhi/02.data.js",
//              "js/xhi/02.fake.js",
//              "js/xhi/03.model.js",
//              "js/xhi/04.utilb.js",
//              "js/xhi/05.css_base.js",
//              "js/xhi/05.css_lb.js",
//              "js/xhi/05.css_shell.js",
//              "js/xhi/06.css.js",
//              "js/xhi/06.lb.js",
//              "js/xhi/07.shell.js",
//              "js/xhi/08.app.js",
//              "js/ex02-build.js"
//            ],
//            "do_compress": true,
//            "do_vendor": true,
//            "target_file": "ex01.js - should be redundant"
//          },
//          "tmplt_make_list": [
//            "TODO: determine template reqs"
//          ]
//        }
//      ]
//    }
//
//
//
//
//
//
//
//
//
//
//       ==============
//       source:js
//       js/foo.js
//       ==============
//
//   Then running the following ...
//
//       $ ${_appName} ./ex01.${_appName}
//
//   ... results in the following files in ${_stageDir}:
//
//       js/ex01-min.js  # uglified JS
//       js/ex01-raw.js  # concatenated JS
//       js/ex01-sp.diag # superpack diagnostics
//       js/ex01-sp.js   # superpacked JS
//
//
//   (2) If the file ex02.${_appName} looks like so:
//       ==============
//       source:js
//       js/foo.js
//
//       source:css
//       css/foo.css
//       ==============
//
//   Then running the following ...
//
//       $ ${_appName} ./ex02.${_appName}
//
//   results in the following files in ${_stageDir}:
//       js/ex02-min.js  # uglified JS
//       js/ex02-raw.js  # concatenated JS
//       js/ex02-sp.diag # superpack diagnostics
//       js/ex02-sp.js   # superpacked JS
//
//       css/ex02-min.css # uglified CSS
//       css/ex02-raw.css # concatenated CSS
//
// ARGUMENTS
//   manifest_1, manifest_2, ... (REQUIRED)
//     Manifests to process.  Each manifest lists the source files to
//     process. It may have multiple sections delineated by a source-type header.
//     ${_appName} expects all paths to be relative to the referencing
//     manifest file path.
//
//        sourcetype:js   # for javascript files, and
//        # ... js files here ...
//        sourcetype:css # for css and source files
//        # ... css files here .... (relative to manifest path)
//
//     Blank lines, comment lines, and trailing comments are ignored.
//
// OPTIONS
//   * -h | --help | --usage (OPTIONAL)
//     Sends short help text to STDERR (usually the terminal) and exits.
//     When combined with the -v option, long help is presented.
//
//   * -n | --nocompress (OPTIONAL)
//     By default ${_appName} concatenates and minifies CSS and JS files.
//     It also SuperPacks JS files.  This option turns off this behavior.
//
//   * -v | --verbose (OPTIONAL)
//     Be noisy when processing
//
// REQUIRED PATCH
//   Buildify uses Superpack symbol compression.  Superpack requires a patch
//   to UglifyJS.  If you have installed **hi\_score** this patch will have
//   been applied when running 'npm run setup' which is the safest means
//   to apply the patch.  If you need to do so manually, this should also work:
//
//     \$ cd ${_modDir}
//     \$ patch -p0 < ../patch/uglifyjs-2.4.10.patch
//
// SEE ALSO
//   * UglifyJS
//   * UglifyCSS
//
// AUTHOR and COPYRIGHT
//   Michael S. Mikowski (c) 2008-2016
//
//   exit 1;
  // BEGIN utility /abortFn/
  function abortFn ( error_data ) {
    console.warn( '>> Abort', error_data );
    process.exit( 1 );
  }
  // . END utility /abortFn/

  // BEGIN utility /logFn/
  function logFn() {
    var arg_list = Array.from( arguments );
    arg_list.unshift( '>>' );
    console.log.apply( null, arg_list );
  }
  // . END utility /logFn/

  // BEGIN utlity /grepFileFn/
  function grepFileFn ( filename, match_str ) {
    return new Promise( function ( resolve_fn ) {
      var
        is_matched    = false,
        line_read_obj = new LineReader( filename, {skipEmptyLines:true })
        ;

      line_read_obj.on( 'error', abortFn );
      line_read_obj.on( 'line',  function ( line_str ) {
        if ( line_str.indexOf( match_str ) > -1 ) {
          is_matched = true;
          line_read_obj.close();
        }
      });
      line_read_obj.on( 'end', function () {
        resolve_fn( is_matched );
      });
    });
  }
  // . END utility /grepFileFn/

  // BEGIN utilities to return resolve and reject functions
  function makeRejectFuncFn ( reject_fn ) {
    return function ( error_data ) { reject_fn( error_data ); };
  }

  function makeResolveFuncFn ( resolve_fn ) {
    return function () { resolve_fn(); };
  }
  // . END utilities to return resolve and reject functions

  // BEGIN utility /copyPathFn/
  function copyPathFn( fq_src_path_str, fq_dest_path_str, do_dir_copy ) {
    if ( do_dir_copy ) {
      return new Promise( function ( resolve_fn, reject_fn ) {
        ncpFn( fq_src_path_str, fq_dest_path_str,
          function ( error_data ) {
            if ( error_data ) { return reject_fn(); }
            resolve_fn();
          }
        );
      });
    }

    return new Promise( function ( resolve_fn, reject_fn ) {
      var
        read_obj         = fsObj.createReadStream(  fq_src_path_str  ),
        write_obj        = fsObj.createWriteStream( fq_dest_path_str ),
        full_reject_fn  = makeRejectFuncFn(  reject_fn  ),
        full_resolve_fn = makeResolveFuncFn( resolve_fn )
        ;

      read_obj.on(  'error', full_reject_fn  );
      write_obj.on( 'error', full_reject_fn  );
      write_obj.on( 'close', full_resolve_fn );
      read_obj.pipe( write_obj );
    });
  }
  // . END utility /copyPathFn/

  // BEGIN utility /storePathFn/
  function storePathFn ( path_str ) {
    var
      context_map = this,
      exe_key = context_map.exe_key;

    if ( ! exe_key ) {
      abortFn( 'No key provided for ' + path_str );
    }
    exePathMap[ exe_key ] = path_str;
  }
  // . END utility /storePathFn/

  // BEGIN utility /initModuleVarsFn/
  function initModuleVarsFn () {
    var
      exe_list     = [ 'git', 'patch' ],
      exe_count    = exe_list.length,
      promise_list = [],
      idx, exe_key, bound_fn, promise_obj;

    // Bail if node version < versReqInt
    if ( Number( versList[0] ) < versReqInt ) {
      logFn( 'As of hi_score 1.2+ NodeJS v'
        + versReqInt + ' is required.'
      );
      logFn( 'NodeJS Version ' + versList.join('.') + ' is installed.' );
      logFn( 'Please upgrade NodeJS and try again.'                    );
      process.exit( 1 );
    }

    // Assign npm module vars
    fqProjDirname   = pathObj.dirname( fqBinDirname );

    fqGitDirname    = fqProjDirname   + '/.git';
    fqModuleDirname = fqProjDirname   + '/node_modules';
    fqPkgFilename   = fqProjDirname   + '/package.json';
    fqPatchFilename = fqProjDirname   + '/patch/uglify-js-3.0.21.patch';

    fqUglyDirname   = fqModuleDirname + '/uglifyjs';
    fqScopeFileStr  = fqUglyDirname   + '/lib/scope.js';

    // Assign executable path vars
    for ( idx = 0; idx < exe_count; idx++ ) {
      exe_key = exe_list[ idx ];
      bound_fn = storePathFn.bind( { exe_key : exe_key });
      promise_obj = makeWhichProm( exe_key );
      promise_obj.then( bound_fn ).catch( abortFn );
      promise_list.push( promise_obj );
    }

    promiseObj.all( promise_list )
      .then( function () { eventObj.emit( '01ReadPkgFile' ); } )
      .catch( abortFn );
  }
  // . END utility /initModuleVarsFn/

  // BEGIN utility /storePkgMapFn/
  function storePkgMapFn ( error_obj, json_str ) {
    if ( error_obj ) { return abortFn( error_obj ); }
    pkgMatrix   = JSON.parse( json_str ) || [];
    setupMatrix = pkgMatrix.xhiSetupMatrix;
    if ( ! setupMatrix ) {
      abortFn( 'SetupMatrix not set in package.json' );
    }
    eventObj.emit( '02RmVendorDirs' );
  }
  // . END utility /storePkgMapFn/

  // BEGIN utility /readPkgFileFn/
  function readPkgFileFn () {
    fsObj.readFile( fqPkgFilename, 'utf8', storePkgMapFn, abortFn );
  }
  // END utility /readPkgFileFn/

  // BEGIN utility /rmVendorDirsFn/
  function rmVendorDirsFn () {
    var
      asset_group_table  = setupMatrix.asset_group_table,
      asset_group_count  = asset_group_table.length,
      promise_list       = [],

      idx, asset_group_map, fq_dest_dir_str, promise_obj
      ;

    for ( idx = 0; idx < asset_group_count; idx++ ) {
      asset_group_map = asset_group_table[ idx ] || {};
      fq_dest_dir_str = fqProjDirname + '/' + asset_group_map.dest_dir_str;
      mkdirpFn.sync( fq_dest_dir_str );

      promise_obj = makeRmDirProm( fq_dest_dir_str );
      promise_list.push( promise_obj );
    }

    promiseObj.all( promise_list )
      .then( function () { eventObj.emit( '03CopyVendorFiles' ); } )
      .catch( abortFn );
  }
  // . END utility /rmVendorDirsFn/

  // BEGIN utility /copyVendorFilesFn/
  function copyVendorFilesFn () {
    var
      asset_group_table  = setupMatrix.asset_group_table || [],
      dev_dependency_map = pkgMatrix.devDependencies     || {},
      asset_group_count  = asset_group_table.length,
      promise_list       = [],

      idx, asset_group_map, asset_list, asset_count,
      fq_dest_dir_str, dest_ext_str, do_dir_copy,

      idj, asset_map, src_asset_name, src_dir_str,
      src_pkg_name, dest_vers_str, dest_name,
      fq_src_path_list, fq_src_path_str,
      fq_dest_path_str, promise_obj
      ;

    for ( idx = 0; idx < asset_group_count; idx++ ) {
      asset_group_map = asset_group_table[ idx ] || {};

      asset_list  = asset_group_map.asset_list   || [];
      asset_count = asset_list.length;

      dest_ext_str     = asset_group_map.dest_ext_str;
      do_dir_copy      = asset_group_map.do_dir_copy;
      fq_dest_dir_str  = fqProjDirname + '/' + asset_group_map.dest_dir_str;


      mkdirpFn.sync( fq_dest_dir_str );
      ASSET_MAP: for ( idj = 0; idj < asset_count; idj++ ) {
        asset_map = asset_list[ idj ];
        src_asset_name = asset_map.src_asset_name;
        src_dir_str    = asset_map.src_dir_str || '';
        src_pkg_name   = asset_map.src_pkg_name;

        dest_vers_str  = dev_dependency_map[ src_pkg_name ];

        if ( ! dest_vers_str ) {
          logFn( 'WARN: package ' + src_pkg_name + ' not found.');
          continue ASSET_MAP;
        }
        dest_name = asset_map.dest_name || src_pkg_name;

        fq_dest_path_str = fq_dest_dir_str
          + '/' + dest_name + '-' + dest_vers_str;
        fq_src_path_list = [ fqModuleDirname, src_pkg_name, src_asset_name ];
        if ( src_dir_str ) { fq_src_path_list.splice( 2, 0, src_dir_str ); }

        fq_src_path_str = fq_src_path_list.join( '/' );

        if ( ! do_dir_copy ) {
          fq_dest_path_str += '.' + dest_ext_str;
        }
        promise_obj = copyPathFn( fq_src_path_str, fq_dest_path_str, do_dir_copy );
        promise_list.push( promise_obj );
      }
    }

    promiseObj.all( promise_list )
      .then( function () { eventObj.emit( '04PatchFiles' ); } )
      .catch( abortFn );
  }
  // . END utility /copyVendorFilesFn/

  // BEGIN utility /patchIfNeededFn/
  function patchIfNeededFn ( is_check_found ) {
    var context_map = this;
    if ( is_check_found ) {
      logFn( 'Patch ' + context_map.relative_name + ' already applied.' );
    }
    else {
      applyPatchFn( context_map.relative_name );
      logFn( 'Applied patch ' + context_map.relative_name );
    }
  }
  // . END utility /patchIfNeededFn/

  // BEGIN utility /patchFilesFn/
  function patchFilesFn () {
    var
      patch_matrix     = setupMatrix.patch_matrix   || {},
      patch_dir_str    = patch_matrix.patch_dir_str || '',
      patch_map_list   = patch_matrix.patch_map_list|| [],
      patch_map_count  = patch_map_list.length,
      promise_list     = [],
      idx, patch_map, promise_obj,
      check_filename, patch_filename,
      bound_fn
      ;
    process.chdir( fqProjDirname );

    for ( idx = 0; idx < patch_map_count; idx++ ) {
      patch_map      = patch_map_list[ idx ];
      check_filename = patch_map.check_filename;
      patch_filename = patch_map.patch_filename;
      patch_map.relative_name = patch_dir_str + '/' + patch_filename;

      promise_obj    = grepFileFn( check_filename, patch_map.match_str );
      bound_fn       = patchIfNeededFn.bind( patch_map );
      promise_obj.then( bound_fn ).catch( abortFn );
      promise_list.push( promise_obj );
    }

    Promise.all( promise_list )
      .then( function () {
        process.chdir( fqOrigDirname );
        eventObj.emit( '05CheckGitInstall' );
      })
      .catch( abortFn );
  }
  // . END utility /patchFilesFn/

  // BEGIN utility /checkGitInstallFn/
  function checkGitInstallFn () {
    var promise_obj = makeStatProm( fqGitDirname );
    promise_obj.then( function () {
      logFn( 'Git directory ' + fqGitDirname + ' found.');
      logFn( 'Installing commit hook...' );
      eventObj.emit( '06UnLinkHook' );
    })
    .catch( function () {
      logFn( 'Git directory ' + fqGitDirname + ' NOT found.');
      logFn( 'Please "npm run setup" if you add code to a git repo.' );
      eventObj.emit( '99FinishRun');
    });
  }
  // . END utility /checkGitInstallFn/

  // BEGIN utility /unlinkHookFn/
  function unlinkHookFn () {
    fqHookFilename = fqProjDirname + '/.git/hooks/pre-commit';
    fsObj.unlink( fqHookFilename, function ( error_data ) {
      // Ignore any error
      eventObj.emit( '07LinkHook' );
    });
  }
  // . END utility /unlinkHookFn/

  // BEGIN utility /linkHookFn/
  function linkHookFn () {
    process.chdir( fqProjDirname );
    fsObj.symlink(
      '../../bin/git-hook_pre-commit',
      fqHookFilename,
      function ( error_data ) {
        if ( error_data ) { abortFn( error_data ); }
        process.chdir( fqOrigDirname );
        eventObj.emit( '99FinishRun');
      }
    );
  }
  // . END utility /linkHookFn/
  // == END UTILITY METHODS ============================================

  // == BEGIN EVENT HANDLERS ===========================================
  function on00InitVarsFn () {
    logFn( appName, 'Started.' );
    logFn( 'Initializing variables...' );
    initModuleVarsFn();
  }
  function on01ReadPkgFileFn () {
    logFn( 'Reading package file...' );
    readPkgFileFn();
  }
  function on02RmVendorDirsFn () {
    logFn( 'Removing vendor directories...' );
    rmVendorDirsFn();
  }
  function on03CopyVendorFilesFn () {
    logFn( 'Deploying vendor assets...' );
    copyVendorFilesFn();
  }
  function on04PatchFilesFn () {
    logFn( 'Applying patches...' );
    patchFilesFn();
  }
  function on05CheckGitInstallFn () {
    logFn( 'Checking for git installation...' );
    checkGitInstallFn();
  }
  function on06UnlinkHookFn () {
    logFn( 'Remove any old commit hook...' );
    unlinkHookFn();
  }
  function on07LinkHookFn () {
    logFn( 'Linking commit hook...' );
    linkHookFn();
  }
  function on99FinishRunFn () {
    logFn( appName, 'Finished.' );
    process.exit( 0 );
  }
  // == . END EVENT HANDLERS ===========================================

  // == BEGIN Main =====================================================
  function mainFn () {
    // Layout flow control
    eventObj.on( '00InitVars',         on00InitVarsFn         );
    eventObj.on( '01ReadPkgFile',      on01ReadPkgFileFn      );
    eventObj.on( '02RmVendorDirs',     on02RmVendorDirsFn     );
    eventObj.on( '03CopyVendorFiles',  on03CopyVendorFilesFn  );
    eventObj.on( '04PatchFiles',       on04PatchFilesFn       );
    eventObj.on( '05CheckGitInstall',  on05CheckGitInstallFn  );
    eventObj.on( '06UnlinkHook',       on06UnlinkHookFn       );
    eventObj.on( '07LinkHook',         on07LinkHookFn         );
    eventObj.on( '99FinishRun',        on99FinishRunFn        );

    // Start execution
    // Timeout prevents race condition
    setTimeout( function () { eventObj.emit( '00InitVars' ); }, 0 );
  }
  // == . END Main =====================================================

  mainFn();


// ## Function to echo to STDERR
// ## Function to print usage
// ## Function to log output
// ## Function to clean up temp files
// ## Function to abort processing
// ## BEGIN MAIN
//   ## Get options
//   ## Set global log to start
//   ## Find SuperPack
//   ## Confirm SuperPack has correct modules installed
//   ## Find UglifyJS
//   ## Find UglifyCSS
//   ## Validiate input files
//   ## Validate and create build dir and move global log to it
//   ##    TODO: 2017-07-21 Put these under a build number in builddir
//   ##    TODO: 2017-07-21 Link latest build builddir/xxx -> last
//   ## BEGIN process each manifest in turn
//     ## Get path of manifest and determine output names
//     ## Read manifest and append sources to arrays copy / css / js / copy_dir
//     ## Determine paths
//     ## Process javascript files
//     ## Compress javascript file if specified
//     ## Superpack javascript file if specified
//     ## Process css files
//     ## Compress css file if specified
//     ## Move over remaining files
//     ## Deployment (WIP)
//   ## . END process each manifest in turn
//   ## Cleanup
// ## . END MAIN


// ## == BEGIN Layout variables ===============================================
//   _appName=$( basename $0 );
//   _launchDir=$( pwd );
//   echo "start ${_appName}";
//   echo "  > layout vars";
//
//     # app path and name
//     _appLink=$( readlink -f -- "${0}" );
//     _binDir=$( cd "${_appLink%/*}" && echo "${PWD}" );
//
//     # npm modules paths
//     _npmDir=$( dirname "${_binDir}" );
//     _modDir="${_npmDir}/node_modules";
//     _modDirBin="${_modDir}/.bin";
//
//     _buildDir="${_npmDir}/build";
//     _distDir="${_buildDir}/dist";
//     _stageDir="${_buildDir}/stage";
//
//     _topLogName="${_appName}.log";
//     _topLogFile="${_npmDir}/${_topLogName}";
//
//     # cli varibles defaults
//     _argDoHelp=0;
//     _argDoVerbose=0;
//     _argDontCompress=0;
//     _templateDir="${_npmDir}/tmplt";
//
//     # executables
//     _packExe="${_binDir}/superpack";
//     _ugjsExe="${_modDirBin}/uglifyjs";
//     _ugcssExe="${_modDirBin}/uglifycss";
//
//     # timestamps
//     _startTimestamp=$(date "+%Y-%m-%d %H:%M:%S");
//     _dateExt=$(date "+%Y%m%d_%H%M%S");
//
//     # temp dir
//     # See http://www.linuxsecurity.com/content/view/115462/81/#mozTocId440182
//     _tmpDir="${TMPDIR:-/tmp}/$$.${_appName}.${_dateExt}";
//     ( umask 077 && mkdir "${_tmpDir}" ) || {
//       _argDoVerbose=1;
//       _logFn "  ! Could not create temporary directory";
//       _abortFn;
//     }
//   # echo "  < layout vars";
//   ## == END Layout variables ===============================================
//
// ## BEGIN function to echo to STDERR
// _logStderrFn () { echo "$*" >&2; }
// ## END function to echo to STDERR
//
// ## BEGIN function to print usage
// _showHelpFn () {
//   _logStderrFn "
// NAME : ${_appName}
//
// SYNOPSIS
//   ${_appName} [ options ] <manifest_1> <manifest_2> ...
// ";
//
//   [ "${_argDoVerbose}" -lt 1 ] && _logStderrFn "
// Employ the -v or --verbose switch to see more detailed help.
// ";
//
//   [ "${_argDoVerbose}" -gt 0 ] && _logStderrFn "
// DESCRIPTION
//   ${_appName} builds a production-ready web site from sources listed
//   in manifest files.  The output files are placed in ${_buildDir}
//   under the following subdirectories:
//
//     - ${_stageDir} - Staging area
//     - ${_distDir}  - Distribution area
//
//   The output files will have the same basename as the source manifest
//   file.  Therefore, '${_appName} ex01.${_appName}' will output
//   the files with the ex01 prefix as illustrated in the examples.
//
// EXAMPLES
//   (1) If the file ex01.${_appName} looks like so:
//       ==============
//       source:js
//       js/foo.js
//       ==============
//
//   Then running the following ...
//
//       $ ${_appName} ./ex01.${_appName}
//
//   ... results in the following files in ${_stageDir}:
//
//       js/ex01-min.js  # uglified JS
//       js/ex01-raw.js  # concatenated JS
//       js/ex01-sp.diag # superpack diagnostics
//       js/ex01-sp.js   # superpacked JS
//
//
//   (2) If the file ex02.${_appName} looks like so:
//       ==============
//       source:js
//       js/foo.js
//
//       source:css
//       css/foo.css
//       ==============
//
//   Then running the following ...
//
//       $ ${_appName} ./ex02.${_appName}
//
//   results in the following files in ${_stageDir}:
//       js/ex02-min.js  # uglified JS
//       js/ex02-raw.js  # concatenated JS
//       js/ex02-sp.diag # superpack diagnostics
//       js/ex02-sp.js   # superpacked JS
//
//       css/ex02-min.css # uglified CSS
//       css/ex02-raw.css # concatenated CSS
//
// ARGUMENTS
//   manifest_1, manifest_2, ... (REQUIRED)
//     Manifests to process.  Each manifest lists the source files to
//     process. It may have multiple sections delineated by a source-type header.
//     ${_appName} expects all paths to be relative to the referencing
//     manifest file path.
//
//        sourcetype:js   # for javascript files, and
//        # ... js files here ...
//        sourcetype:css # for css and source files
//        # ... css files here .... (relative to manifest path)
//
//     Blank lines, comment lines, and trailing comments are ignored.
//
// OPTIONS
//   * -h | --help | --usage (OPTIONAL)
//     Sends short help text to STDERR (usually the terminal) and exits.
//     When combined with the -v option, long help is presented.
//
//   * -n | --nocompress (OPTIONAL)
//     By default ${_appName} concatenates and minifies CSS and JS files.
//     It also SuperPacks JS files.  This option turns off this behavior.
//
//   * -v | --verbose (OPTIONAL)
//     Be noisy when processing
//
// REQUIRED PATCH
//   Buildify uses Superpack symbol compression.  Superpack requires a patch
//   to UglifyJS.  If you have installed **hi\_score** this patch will have
//   been applied when running 'npm run setup' which is the safest means
//   to apply the patch.  If you need to do so manually, this should also work:
//
//     \$ cd ${_modDir}
//     \$ patch -p0 < ../patch/uglifyjs-2.4.10.patch
//
// SEE ALSO
//   * UglifyJS
//   * UglifyCSS
//
// AUTHOR and COPYRIGHT
//   Michael S. Mikowski (c) 2008-2016
// ";
//
//   exit 1;
// }
// ## END function to print usage
//
// ## BEGIN function to log output
// _logFn () {
//   local IFS="";
//   _msg_str="$*";
//   if [ -w "${_topLogFile}" ]; then
//     echo "${_msg_str}" >> "${_topLogFile}";
//   else
//     _logStderrFn "${_msg_str}"
//   fi
//
//   if [ "${_argDoVerbose}" -gt 0 ]; then _logStderrFn "${_msg_str}"; fi
//   return 0;
// }
// ## END function to log output
//
// ## BEGIN function to clean up temp files
// _cleanTmpdirFn () {
//   if [ -w "${_tmpDir}" ]; then
//     if echo "${_tmpDir}" | grep -q "${_appName}"; then
//       _argDoVerbose=1;
//       _logFn "  > Removed temporary directory ${_tmpDir}";
//       rm -rf "${_tmpDir}";
//     fi
//   fi
// }
// ## END function to clean up temp files
//
// ## BEGIN function to abort processing
// _abortFn () {
//   _argDoVerbose=1;
//   _logFn '';
//   _logFn "## See ${_appName} -hv for detailed usage.";
//   _logFn "## ! Processing ABORTED.";
//
//   _cleanTmpdirFn;
//   # exit with error (bash shell standard)
//   exit 1;
// }
// ## END function to abort processing
//
// ## BEGIN MAIN
//   ## BEGIN get options
//   ## (see /usr/share/doc/util-linux/examples/getopt-parse.bash)
//   _cliStr=$(getopt -o hnvt: \
//     --long help,usage,nocompress,verbose: \
//       -n "${_appName}" -- "$@")
//
//   if [ $? != 0 ] ; then
//     _argDoVerbose=1;
//     _logStderrFn "  ! Trouble processing command line.";
//     _abortFn;
//   fi
//
//   # Note the quotes around $_cliStr: they are essential!
//   eval set -- "${_cliStr}"
//
//   # Process arguments
//   while true; do
//     case "$1" in
//       -h|--help|--usage) _argDoHelp=1;       shift ;;
//       -n|--nocompress)   _argDontCompress=1; shift ;;
//       -v|--verbose)      _argDoVerbose=1;    shift ;;
//       --) shift; break ;;
//        *) _argDoVerbose=1;
//           _logStderrFn "Trouble processing command line.";
//           _abortFn;;
//     esac
//   done
//
//   if [ ${_argDoHelp} -gt 0 ]; then _showHelpFn; fi
//   ## END get options (see /usr/share/doc/util-linux/examples/getopt-parse.bash)
//
//   ## BEGIN set global log to start
//   if ! echo -n > "${_topLogFile}"; then
//     _argDoVerbose=1;
//     _logStderrFn "Cannot create global log file '${_topLogFile}'";
//     _abortFn;
//   fi
//   # put header in log file
//   _logFn "  > Global ${_appName} log ${_startTimestamp}";
//   ## END set global log to start
//
//   ## BEGIN Find SuperPack
//   if [ ! -x "${_packExe}" ]; then
//     _argDoVerbose=1;
//     _logFn "  ! Superpack (${_packExe}) is not excutable";
//     _abortFn;
//   fi
//   if ( ! perl -cw "${_packExe}" >/dev/null 2>&1 ); then
//     _argDoVerbose=1;
//     _logFn "  ! SuperPack is not valid perl.";
//     _logFn "  ! Please install perl-List-MoreUtils perl-File-Slurp: ";
//     _logFn "  ! and perl-Getopt-Mixed:";
//     _logfn "  !  \$ sudo apt-get install libfile-slurp-perl \\ ";
//     _logfn "  !    liblist-moreutils-perl libgetopt-mixed-perl ";
//     _abortFn;
//   fi
//   ## END Find SUPERPACK
//
//   ## BEGIN Find UglifyJS
//   if [ ! -x "${_ugjsExe}" ]; then
//     _argDoVerbose=1;
//     _logFn "  ! UglifyJS (${_ugjsExe}) is not executable.";
//     _logFn "  ! Try cd ${_npmDir}; npm install uglifyjs@2.4.10 -D"
//     _logFn "  ! AND THEN ensure the patch is applied (see patch/)"
//     _logFn "  ! as described by ${_appName} -hv"
//     _abortFn;
//   fi
//   ## END Find UglifyJS
//
//   ## BEGIN Find UglifyCSS
//   if [ -z "${_ugcssExe}" ]; then
//     _argDoVerbose=1;
//     _logFn "  ! UglifyCSS (${_ugcssExe}) is not executable.";
//     _logFn "  ! Try cd ${_npmDir}; npm install uglifycss -D"
//     _abortFn;
//   fi
//   ## END Find UglifyCSS
//
//   ## BEGIN validiate input files
//   _manifestList=();
//   _copyDeployList=();
//   _subtreeDeployList=();
//   for _arg_file in $@; do
//     if [ ! -f "${_arg_file}" ]; then
//       _argDoVerbose=1;
//       _logFn "  ! manifest file '${_arg_file}' is not a regular file.";
//       _abortFn;
//     fi
//
//     if [ ! -r "${_arg_file}" ]; then
//       _argDoVerbose=1;
//       _logFn "  ! manifest file '${_arg_file}' is not readable.";
//       _abortFn;
//     fi
//
//     _manifestList[${#_manifestList[*]}]="${_arg_file}"
//     _logFn "  > Adding ${_arg_file} to manifest list"
//   done
//
//   if [ "${#_manifestList[*]}" = 0 ]; then
//     _argDoVerbose=1;
//     _logFn "  ! No manifest provided."
//     _abortFn;
//   fi
//   ## END validiate input files
//
//   ## BEGIN validate build dir and move global log to it
//   if [ -d "${_buildDir}" ]; then
//     _scratchStr="${_argDoVerbose}";
//     _argDoVerbose=1;
//     _logFn "The build directory ${_buildDir} already exists."
//     read -p 'Wipe and recreate? (y/N) ' _responseStr;
//     _responseStr="${_responseStr^^}";
//     if [ "${_responseStr^^:=N}" == 'N' ]; then
//       _logFn "  ! Aborted at user request.";
//       _abortFn;
//     fi
//     _logFn "";
//     _logFn "  > Removing ${_buildDir} at user request";
//     rm -rf "${_buildDir}";
//     _logFn "  > Removal complete.";
//     _argDoVerbose="${_scratchStr}"
//   fi
//
//   _logFn "  > Processing";
//   mkdir ${_buildDir};
//   mkdir ${_stageDir};
//   mkdir ${_distDir};
//   mkdir -p "${_distDir}/css/vendor";
//   mkdir -p "${_distDir}/js/vendor";
//   mkdir -p "${_distDir}/img/vendor";
//   mkdir -p "${_distDir}/font/vendor";
//
//   if [ "${_topLogFile}" != "${_buildDir}/${_topLogName}" ] \
//     && ! mv "${_topLogFile}" "${_buildDir}"; then
//     _argDoVerbose=1;
//     _logFn "  ! Could not move global log to build directory";
//     _abortFn;
//   else
//     _topLogFile="${_buildDir}/${_topLogName}";
//   fi
//   ## END validate build dir and move global log there
//
//   ## BEGIN process each manifest in turn
//   for (( _file_idx = 0; _file_idx < ${#_manifestList[*]}; _file_idx++ )); do
//     ## BEGIN get path of manifest and determine output names
//     _manifest_file="${_manifestList[$_file_idx]}";
//     _manifest_basename=$( basename "${_manifest_file}" );
//     _manifest_short_name=$( echo "${_manifest_basename}" |cut -f1 -d'.' );
//     _manifest_dir=$( dirname "${_manifest_file}" );
//     _manifest_dir=$( cd "${_manifest_dir}" && echo "${PWD}" );
//
//     if [ -z "${_manifest_short_name}" ]; then
//       _argDoVerbose=1;
//       _logFn "  ! Root name of the manifest is empty.";
//       _abortFn;
//     fi
//
//     _logFn "  > ${_appName}  for ${_manifest_file} on ${_startTimestamp}";
//     ## END get path of manifest and determine output names
//
//     ## BEGIN read manifest and append sources to arrays
//     _js_file_list=();
//     _css_file_list=();
//     _section_type="";
//
//     while read _row_str; do
//       # skip blank lines
//       echo "${_row_str}" | grep -q '^\s*$' && continue;
//       # skip full-line comments
//       echo "${_row_str}" | grep -q '^\s*#' && continue;
//
//       # strip end of line comments and indents
//       _row_str=$(echo "${_row_str}" | sed -e 's/#.*$//g' \
//         | sed -e 's/^\s\+//g' | sed -e 's/\s\+$//g' );
//
//       # process section header 'sourcetype'
//       if echo "${_row_str}" | grep -q '^sourcetype\s*:'; then
//         _section_type=$( echo "${_row_str}" |sed -e 's/sourcetype\s*:\s*//g' );
//         _logFn "  > Section: ${_row_str}"
//         continue;
//       fi
//
//       # skip anything if section type not yet specified
//       [ "${_section_type}" == "" ] && continue;
//
//       # determine full path to source file and test
//       _source_file="${_manifest_dir}/${_row_str}";
//
//       if [ "${_section_type}" = "css" ] || [ "${_section_type}" = "js" ]; then
//         if [ ! -r "${_source_file}" ]; then
//           _argDoVerbose=1;
//           _logFn "  ! ${_section_type} file ${_source_file} is not readable.";
//           _logFn "  ! Do you need to update your manifest file?";
//           _logFn "  ! X_${_row_str}_X";
//           _abortFn;
//         fi
//       fi
//       _ext_str=$( echo ${_row_str} |sed -e 's/^.*\.//' );
//
//       case "${_section_type}" in
//         js)
//           if [ "${_ext_str}" != 'js' ]; then
//             _argDoVerbose=1;
//             _logFn "  > Extension for js file ${_row_str} must be 'js'";
//             _abortFn;
//           fi
//
//           _js_file_list[${#_js_file_list[*]}]=${_source_file};
//             _logFn "  > Added file ${_row_str} to javascript processing queue.";
//           ;;
//
//         css)
//           if [ "${_ext_str}" != 'css' ]; then
//             _argDoVerbose=1;
//             _logFn "  ! Extension for css file ${_row_str} must be 'css'";
//             _abortFn;
//           fi
//
//           _css_file_list[${#_css_file_list[*]}]=${_source_file};
//           _logFn "  > Added file ${_row_str} to css processing queue.";
//           ;;
//         subtree)
//           _subtreeDeployList[${#_css_file_list[*]}]=${_source_file};
//           _scratchStr="${_argDoVerbose}"; _argDoVerbose=1;
//           # _logFn "  ! deploy subtree not yet implemented ${_row_str}";
//           _argDoVerbose="${_scratchStr}";
//           ;;
//         copy)
//           _copyDeployList[${#_css_file_list[*]}]=${_source_file};
//           _scratchStr="${_argDoVerbose}"; _argDoVerbose=1;
//           # _logFn "  ! deploy copy not yet implemented ${_row_str}";
//           _argDoVerbose="${_scratchStr}";
//           ;;
//         *) _argDoVerbose=1;
//           _logFn "  ! Source type (${_section_type}) not supported.";
//           _abortFn;
//           ;;
//       esac
//     done < "${_manifest_file}"
//     ## END read manifest and append sources to arrays
//
//     ## BEGIN determine paths
//     _js_concat_file="${_tmpDir}/$$.${_manifest_short_name}-src.js";
//     _css_concat_file="${_tmpDir}/$$.${_manifest_short_name}-src.css";
//
//     _stage_base_name="${_stageDir}/${_manifest_short_name}";
//
//     _pack_log_file="${_stage_base_name}-sp.log";
//     _pack_diag_file="${_stage_base_name}-sp.diag";
//     _ugcss_log_file="${_stage_base_name}-ug_css.log";
//     _ugjs_log_file="${_stage_base_name}-ug_js.log";
//
//     _css_out_file="${_stage_base_name}-raw.css";
//     _js_out_file="${_stage_base_name}-raw.js";
//     _ugcss_out_file="${_stage_base_name}-min.css";
//     _ugjs_out_file="${_stage_base_name}-min.js";
//     _pack_out_file="${_stage_base_name}-sp.js";
//     touch "${_pack_log_file}";
//     ## END determine paths
//
//
//     ## BEGIN process javascript files
//     for (( i = 0; i < ${#_js_file_list[*]}; i++ ))
//     do
//       if [ ! -r "${_js_concat_file}" ]; then
//         touch "${_js_concat_file}";
//         if [ ! -r "${_js_concat_file}" ]; then
//           _argDoVerbose=1;
//           _logFn "Cannot create concatenation file '${_js_concat_file}'";
//           _logFn "for Javascript processing."
//           _abortFn;
//         fi
//         _logFn "  > Combining JS Source Files";
//       fi
//       cat "${_js_file_list[$i]}" >> "${_js_concat_file}";
//       _logFn "  > ${_js_file_list[$i]}";
//     done
//     ## END process javascript files
//
//     ## BEGIN compress javascript file if specified
//     if [ -r "${_js_concat_file}" ] && [ ${_argDontCompress} -eq 0 ]; then
//       _logFn "  > Uglify compressing '${_js_concat_file}'";
//
//       ${_ugjsExe} "${_js_concat_file}" -mc \
//         1>  "${_ugjs_out_file}" \
//         2>> "${_ugjs_log_file}";
//       _ugjs_exit_code=$?;
//
//       if [ ${_ugjs_exit_code} == 0 ]; then
//         _logFn "  > Compression successful.  Output is '${_ugjs_out_file}'";
//         rm "${_ugjs_log_file}";
//       else
//         _argDoVerbose=1;
//         _logFn "  ! Compression of '${_js_concat_file}' not successfull";
//         _logFn "  ! See '${_ugjs_log_file}' for errors";
//         _abortFn;
//       fi
//     fi
//     ## END compress javascript file if specified
//
//     ## BEGIN superpack javascript file if specified
//     if [ -r "${_js_concat_file}" ] && [ ${_argDontCompress} -eq 0 ]; then
//       ${_packExe} \
//         -i "${_ugjs_out_file}" \
//         -o "${_pack_out_file}" \
//         -l "${_pack_log_file}" \
//         > ${_pack_diag_file} 2>&1
//       _pack_exit_code=$?;
//
//       if [ ${_pack_exit_code} == 0 ]; then
//         _logFn "  > SuperPack successful.  Output is '${_pack_out_file}'";
//       else
//         _argDoVerbose=1;
//         _logFn "  ! SuperPack of '${_js_concat_file}' not successfull";
//         _logFn "  ! See '${_pack_log_file}' for errors";
//         _abortFn;
//       fi
//     fi
//     ## END superpack javascript file if specified
//
//     ## BEGIN process css files
//     for (( i = 0; i < ${#_css_file_list[*]}; i++ ))
//     do
//       if [ ! -r "${_css_concat_file}" ]; then
//         touch "${_css_concat_file}";
//         if [ ! -r "${_css_concat_file}" ]; then
//           _argDoVerbose=1;
//           _logFn "  ! Cannot create concatenation file '${_css_concat_file}'";
//           _logFn "  ! for CSS processing.";
//           _abortFn;
//         fi
//         _logFn "  > Combining CSS Source Files";
//         _logFn "  > Writing css concat file '${_css_concat_file}'";
//       fi
//       cat "${_css_file_list[$i]}" >> "${_css_concat_file}";
//       _logFn "  >> ${_css_file_list[$i]}";
//     done
//     ## END process css files
//
//     ## BEGIN compress css file if specified
//     if [ -r "${_css_concat_file}" ] && [ ${_argDontCompress} -eq 0 ]; then
//       _logFn "  > UglifyCSS Compressing '${_css_concat_file}'";
//
//       ${_ugcssExe} "${_css_concat_file}" \
//         1> "${_ugcss_out_file}" \
//         2>> "${_ugcss_log_file}";
//       _ugcss_exit_code=$?;
//
//       if [ ${_ugcss_exit_code} == 0 ]; then
//         _logFn "  > Compression successful.  Output is '${_ugcss_out_file}'";
//         rm "${_ugcss_log_file}";
//       else
//         _argDoVerbose=1;
//         _logFn "  ! Compression of '${_css_concat_file}' not successfull";
//         _logFn "  ! See '${_ugcss_log_file}' for warnings";
//         _abortFn;
//       fi
//     fi
//     ## END compress css file if specified
//
//     ## BEGIN move over remaining files
//     for _pair_str in \
//       "${_js_concat_file}|${_js_out_file}" \
//       "${_css_concat_file}|${_css_out_file}";
//     do
//       _pair_src_file=$(echo "${_pair_str}" |cut -f1 -d'|');
//       _pair_dst_file=$(echo "${_pair_str}" |cut -f2 -d'|');
//
//       if [ -r "${_pair_src_file}" ]; then
//         if ! mv "${_pair_src_file}" "${_pair_dst_file}"; then
//           _argDoVerbose=1;
//           _logFn "Could not move ${_pair_src_file} to ${_pair_dst_file}";
//           _abortFn;
//         fi
//       fi
//     done
//     ## END move over remaining files
//
//     ## BEGIN deployment (WIP)
//     pushd "${_distDir}";
//     cp "${_templateDir}/${_manifest_short_name}.html" "${_distDir}/"
//     cp -a "${_npmDir}"/font/vendor/* "${_distDir}/font/vendor/"
//     cp "${_pack_out_file}" "${_distDir}/js/"
//     cp "${_ugcss_out_file}" "${_distDir}/css/"
//     popd;
//     ## END deployment (WIP)
//
//   done
//   ## END process each manifest in turn
//
//   _cleanTmpdirFn;
//   _endTimestamp=$(date "+%Y-%m-%d %H:%M:%S");
//   _logFn "  > ${_appName} run complete on ${_endTimestamp}";
//   echo "end ${_appName}";
// ## END MAIN
