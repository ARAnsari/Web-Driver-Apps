//////////////////////////////CRUD FROM TODO MONGO EXAMPLE///////////////////////////////////////////////////////
///////////////////////////APP.JS////////////////////////////////////////////////////////////////////////////////
//window.df.apis.localmongo.createRecords({"table_name":"Driverloc", "body":item}
//i have only used getrecords 
//table display some data formatting
//data-table not yet granted
//THIS IS PART OF DRIVER LOGGING, GETTING AND CONFIRMING SESION, 
//FROM CONFIRMED SESSION SENDING IT TO MONGO DRIVERLOC COLLECTION
//login is now fine grained, battletested it is SESSION based so page gone login gone
//mongo driver loc also la gooda
//driver log in is now on display
//SOCKET IO Built in Node js connected 
//display job received as a result of dispatch along with vias no many how many
//show network connectivity EVENT way
var DriverId;
var jobcontent={};
var jobstring;
var netstatus;
var officename,vehicletype;
var uniqueid;
var jobaccepted;
var jobdbid;
var myobj;
var bookingref;
var drvshifid;
window.app = {};
document.addEventListener('apiReady', checkSession, true);//dreamfactory
window.addEventListener("offline", function(e) {
  document.getElementById('networkconnectivity').innerHTML="NETWORK:OFFLINE <br>";
  netstatus=false;
}, false);

window.addEventListener("online", function(e) {
  document.getElementById('networkconnectivity').innerHTML="NETWORK:ONLINE<br>";
  netstatus=true;

}, false);

function checkSession() {
    
    window.df.apis.user.getSession({"body":{}}, function (response) {
      //hide login div  
      // existing session found, assign session token
      // to be used for the session duration
      if(response.session_id===""){logIn();}else
      {
        var session = new ApiKeyAuthorization("X-Dreamfactory-Session-Token",
            response.session_id, 'header');
        window.authorizations.add("X-DreamFactory-Session-Token", session);
	document.getElementById("login").style.display="none";
	document.getElementById("drvbut").style.display='block';
	alert("Welcome back");
	runApp();}
    }, function (response) {
        // no valid session, try to log in
        logIn();
    });
}

// main app entry point

function runApp() {

    // your app starts here
  
 onDeviceReady();
 
}

function getErrorString(response) {

    var msg = "An error occurred, but the server provided no additional information.";
    if (response.content && response.content.data && response.content.data.error) {
        msg = response.content.data.error[0].message;
    }
    msg = msg.replace(/&quot;/g, '"').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&').replace(/&apos;/g, '\'');
    return msg;
}

//curd error is being used
function crudError(response) {

    if (response.status == 401 || response.status == 403) {
        logIn();
    } else {
        alert(getErrorString(response));
    }
}

function logIn() {

    var email = document.getElementById('UserEmail').value;
    var pw = document.getElementById('Password').value;
    if (!email || !pw) {
        //alert("You must enter your email address and password to continue.");
        return;
    }
    var body = {
        "email":email,
        "password":pw
    };
        window.df.user.login({"body":body}, function (response) {
        // assign session token to be used for the session duration , THIS IS OUR API I HAVE CHANGED IT
        var session = new ApiKeyAuthorization("X-Dreamfactory-Session-Token",
            response.session_id, 'header');
        window.authorizations.add("X-DreamFactory-Session-Token", session);
        officename=response.first_name;//office
        vehicletype=response.last_name;//vehicle type
        DriverId=response.display_name;//actual name to display
        uniqueid=DriverId+"@"+officename+"@"+vehicletype;
        //////////Object.keys(response);
//.first_name", "last_name", "display_name", "email", "phone", "security_question", "default_app_id
	document.getElementById("login").style.display="none";
	document.getElementById("bgimg").style.display='none';
		document.getElementById("drvbut").style.display='block'; 
	//document.getElementById("socket-comm").style.display="block";
	document.getElementById("actionpanel").style.display='block';
	document.getElementById("jobprompt1").style.display="block";
	document.getElementById("logoutme").style.display="block";
	document.getElementById("login1").style.display="none";
	alert("Welcome you are now logged in");
	document.getElementById("Password").value='';
	drvshift("loggedin");
	document.getElementById('boldStuff').innerHTML = DriverId;
	mysocketinit();
	runApp();
    }, function (response) {
        alert("Error getting session");
    });
}



////////////////////////////////////////////////////////////
///////default.js//////////////////////////
var socket;
function mysocketinit(){
socket=io.connect("http://88.150.139.154:4000");
socket.on('connect',addUser);
socket.on('sendjobdrv',manifest); //receiving from server , job that was send by controller
socket.on('revertme',frevert);

////////////////////////////////////
}

function addUser(){
  
socket.emit('addUser',uniqueid);//full format even for general function
socket.emit('addDriver',uniqueid);//for drivers only
 
}


function manifest(jobdata)
{
  jobcontent=jobdata;
  myobj=jobcontent;
  bookingref=jobdbid;
  jobdbid=jobcontent._id;//get jobdbid in global var, will use it for patching
  jobnotify();// audio visual fedback if accept job then we show job
      
}



//////////play sound when job arrives ////////////////
function playSound()
{   
document.getElementById("jobprompt").innerHTML='<audio autoplay="autoplay"><source src="JobOffer.wav" type="audio/mpeg" /></audio>';
document.getElementById("jobprompt1").innerHTML='<progress id="proBar" value="0" max="100" style="width:300px;"></progress><span id="curr"></span><h1 id="comMes"></h1><button style="border:0; height:40px;width:100px;border-radius: 5px;color:#fff;margin-bottom: 35px;" class="bg2" onclick="acceptjob()">ACCEPT JOB</button>';

}
var update;  
function progressing(al) {
  var bar = document.getElementById('proBar');
  var status = document.getElementById('curr');
  status.innerHTML = al+"%";
  bar.value = al;
  al++;
update = setTimeout("progressing("+al+")",250);
if(al == 100){
 status.innerHTML = "100%";
 bar.value = 100;
 clearTimeout(update);
 var completeMessage = document.getElementById('comMes');
 completeMessage.innerHTML = "TimeOut";
jobaccepted=false;
//set statemachine to be rejected
setstate("rejected"); 
document.getElementById("drvstate").innerHTML="State::"+getstate();
//bump the cheeky bugger down the queue ideally by logging him off
setstate("ready");
document.getElementById("drvstate").innerHTML="State::"+getstate();
//log him out and send emit disconnect 
audit("rejected",0); 
flogoutme();
   
}
}
  
function jobnotify()
{
//set statemachine to be job offered
setstate("offered");
document.getElementById("drvstate").innerHTML="State::"+getstate();
playSound();
var now = 0;
progressing(now);  

}

function acceptjob()
{
 document.getElementById('jobdisp').style.border="2px solid"; 
  if(!Object.keys(lastknowgoodpos).length){alert("Please turn on your GPS Now");return;}
 jobaccepted=true;
  clearTimeout(update);
 document.getElementById("jobprompt").innerHTML='';
 document.getElementById("jobprompt1").innerHTML='';
 //patch db so that jobstatus =accepted
 audit("accepted",1); 
 
 //set statemachine to be accepted
 setstate("accepted");
 document.getElementById("drvstate").innerHTML="State::"+getstate();
 document.getElementById("inoshow").style.display="none"; 
 if (jobcontent) {
  	    //jobcontent.tel;//contact
            // var f4 = entry[3];//from_to_via
             var numofvia=(jobcontent.fromtovia.length)-2;
	    var vias="";
	    if(numofvia){
	    for (i=2;i<(numofvia+2);i++)
	    {
	      
	      vias +="<b>via</b>"+(i-1)+": -"+jobcontent.fromtovia[i].address+"<br>";
	      
	    }
	    }


jobstring = "<b>Date:</b>"+jobcontent.date+"<br><b>Time:</b>"+jobcontent.time+"<br><b>From:</b>"+jobcontent.fromtovia[0].address+"<br><b>To:</b>"+jobcontent.fromtovia[1].address+"<br>   <b>Fare:</b>"+jobcontent.fare+"<br><b>Vehicle:</b>"+jobcontent.vehicletype+"<br><b>Vias:<br></b>"+vias+"<br><b>Driver Note:</b>"+jobcontent.drvnote;
	    document.getElementById('jobdisp').innerHTML=jobstring;
            
}
document.getElementById("ienroute").style.display="block";//make enroute button visible

}
  
//////////////progess bar/////////////////////////


//////////////////////Setting state ///////////////////////
///set state
///set label 
///patch db
// 

/////////////////
//this function makes elements visible and hidden the initial state
function setthestage()
{
document.getElementById("bgimg").style.display='block'; 
document.getElementById("login1").style.display="block";
  //initializing hidden by default
document.getElementById("ienroute").style.display="none";
document.getElementById("iorigin").style.display="none";
document.getElementById("iPOB").style.display="none";
document.getElementById("iSTC").style.display="none";
document.getElementById("iclear").style.display="none";  
document.getElementById("inoshow").style.display="none"; 
//document.getElementById("iactuallocation").style.display="none"; 
//document.getElementById("ijobchange").style.display="none"; 
//document.getElementById("icustomerlocationrequest").style.display="none"; 
//document.getElementById("icustomernotify").style.display="none"; 
document.getElementById("irunner").style.display="none"; 
//document.getElementById("socket-comm").style.display="none";
document.getElementById("actionpanel").style.display='none'; 
document.getElementById("jobprompt1").style.display="none";
document.getElementById("jobprompt1").innerHTML="";
document.getElementById("jobprompt").style.display="none";
document.getElementById("jobprompt").innerHTML="";
document.getElementById("login").style.display="";
document.getElementById('boldStuff').innerHTML ="Please Login!";
document.getElementById("logoutme").style.display="none";
document.getElementById("Password").value='';
}

function flogoutme(){
socket.disconnect();//close socket
drvshift("loggedout");
deletedriverloc();
window.df.user.logout();//destroy current session 
setthestage();//restore page to initial stage
}

function frevert(){
//will be sent out by the despatch

//bump up the queue =>done by the node
//clear the state
setstate("ready");
//inform the driver
alert("Job Reverted by Office");
document.getElementById("ienroute").style.display="none";
document.getElementById("iorigin").style.display="none";
document.getElementById("iPOB").style.display="none";
document.getElementById("iSTC").style.display="none";
document.getElementById("iclear").style.display="none";
//////////////////////////////////
document.getElementById("inoshow").style.display="none"; 
//document.getElementById("iactuallocation").style.display="none"; 
//document.getElementById("ijobchange").style.display="none"; 
//document.getElementById("icustomerlocationrequest").style.display="none"; 
//document.getElementById("icustomernotify").style.display="none"; 
document.getElementById("irunner").style.display="none"; 

/////////////////////////////////
document.getElementById('jobdisp').innerHTML="";//reset jobdisp area
document.getElementById("drvstate").innerHTML="State::"+getstate();
socket.emit("drvclear");
}

/////////////////////audit////////////////////

var curstatusvalbuff;
var logvalbuff=[];
function audit(statusval,flagval)
{
  
  var complete=[];//prepare status array
  //user id , driver id , status 
var currentdatetimestr= new Date().toISOString();
complete.push(currentdatetimestr);//datetimestamp
complete.push(statusval);//status state
complete.push("");//controller id
complete.push(uniqueid);//driver id+office+vehicletype=> the usual
complete.push(lastknowgoodpos);//driver id+timestamp+latlon+accuracy+speed =>i know its redundant but to keep the structure 
//read in existing status array
   var tempbuffer=logvalbuff;
   curstatusvalbuff=statusval;//status we updated last time
if(myobj.log){
  //tempbuffer.push(myobj.log);//read in existing status array
  //only first time as afterwards the log has been changed
 }
 else 
 {
  // tempbuffer.push(logvalbuff);
 }
   tempbuffer.push(complete);//push new stats to buffer value
   
 //we need to save this buffer so it can be updated next iteration
   logvalbuff=tempbuffer;
  //myobj.curstatus=tempbuffer;//update object buffers
 
//////////////////////////
//myobj, bookingref got job id

 ////flag = 1,2 [absent or null then unallocated,1:allocated,2:completed]

var item = {"record":[
        {"_id":jobdbid, "logd":tempbuffer,"flag":flagval,"curstatus":statusval}
    ]};//prep record 
    df.apis.localmongo.updateRecords({"table_name":"scarscollection", "body":item}, function (response) {
        //chill it
    }, crudError
    );//update the record with status
  
}

function drvshift(statusval)
{
 var item; 
 var complete={};
 var currentdatetimestr= new Date().toISOString();
 complete.driverid=uniqueid;
 complete.indatentime=currentdatetimestr;//datetimestamp
    
    if(statusval=="loggedin"){
      
      item = {"record":[complete]};//prep record 
      
        window.df.apis.localmongo.createRecords({"table_name":"DriverShift", "body":item}, function (response) {
        drvshifid=response.record[0]._id;
	  //chill it
    }, crudError
    );//create the record with status
    }
    else {
      
      item = {"record":[
        {"_id":drvshifid,"outdatentime":currentdatetimestr}
    ]};//prep record 
    
	df.apis.localmongo.updateRecords({"table_name":"DriverShift", "body":item}, function (response) {
        //chill it
    }, crudError
    );//update the record with status
    }

}

function drvjobcom()
{
  
 var complete={};
 var currentdatetimestr= new Date().toISOString();
 complete.driverid=uniqueid;
 complete.indatentime=currentdatetimestr;//datetimestamp
 complete.jobdbid=jobdbid;     
      var item = {"record":[complete]};//prep record 
      
        window.df.apis.localmongo.createRecords({"table_name":"Driverjobrec", "body":item}, function (response) {
        	  //chill it
    }, crudError
    );//create the record with status
    }
 
//////////////////////////////////////////////////////
var globalstate='ready';
function getstate(){
	return globalstate;
}

function setstate(state2beset){
	globalstate=state2beset;
}    //THIS SCRIPT IS FOR GPS WATCHING USING HTML5 NAVIGATION
    //AND WHENEVER DATA CHANGES SEND IT TO MONGO
    //ALONG WITH SESSION , USERID
    //ERROR HANDLING
    //$("#myelement").data("state") to get the current state of the element
    var entryexist;
    var watchID = null;
    var lastknowgoodpos={};
    var runonce=0;
    var jsondrv;
    var dbid;
    var item;
     // PhoneGap is ready
    //
    function onDeviceReady() {
        
         //window.df.apis.localmongo.getRecordsByFilter({{"table_name":"Driverloc"},{filter:{"0" : "bobthebuilder@norbiton@2"}}}, function (response) {
	 //  alert(response);
        
   // }, crudError
   // );     
        jsondrv=JSON.stringify({ "uniqueid": uniqueid});
        var options = {  enableHighAccuracy: true };
        watchID = navigator.geolocation.watchPosition(onSuccess, onError, options);
    }

    // onSuccess Geolocation
    //
    function onSuccess(position) {
       var gpsreq={};//reset the buffer//making it object
//THE POSITION OBJECT FORMAT
//position.coords
//Coordinates {speed: null, heading: null, altitudeAccuracy: null, accuracy: 150, altitude: null…}
//position.timestamp;
//1404027286285

///////////////////////////////////////////////
	//////////GPS smart handling 
	  //it has to be unique  by design
	 // coords.speed=null; //ignore it
	 // coords.accuracy<=20;
	  
	  
	  
	//////////////////////////////////////////////
        //if(position.coords.accuracy>=20 )return;//ain't doing anything not good enough for us this gps accuracy
	if(uniqueid)
	{
	  
	
	  
	
	
	gpsreq.uniqueid =uniqueid;
	gpsreq.timestamp =position.timestamp;
	gpsreq.latitude =position.coords.latitude;
	gpsreq.longitude =position.coords.longitude;
	gpsreq.accuracy =position.coords.accuracy;
	gpsreq.speed =position.coords.speed;
	lastknowgoodpos=gpsreq;
	//now append to it the driver id
	// there 3 possibilities
	// update only for live positions last known position
	//job statemachine
	//archiving breadcumbs indefinitely in drivers personal collection(shift based buffer)3 shifts 100000
	
	
    item = {"record":[gpsreq]};
    dbupdate();
    
  
   // df.apis.localmongo.createRecords({"table_name":"Driverloc", "body":item}, function (response) {
   //    }, crudError
   // );

	
	//to update the drivers current position only in the database which will be used to view him on map
	//the query such be such that if the records exist it updates else it creates
	
	//
	
	
	
	
	}
	//var element = document.getElementById('geolocation');
        //element.innerHTML = 'Latitude: '           + position.coords.latitude              + '<br />' +
        //                    'Longitude: '          + position.coords.longitude             + '<br />' +
        //                    'Accuracy: '           + position.coords.accuracy              + '<br />' +
	//		    'Speed: '              + position.coords.speed                 + '<br />' +
	//		    'Timestamp: '          + new Date(position.timestamp)          + '<br />' +
	//		    //'Altitude: '           + position.coords.altitude              + '<br />' +
        //                    //'Altitude Accuracy: '  + position.coords.altitudeAccuracy      + '<br />' +
        //                    //'Heading: '            + position.coords.heading               + '<br />' +
                           
                            
        //                    '<hr />';
			    
    }

    // clear the watch that was started earlier
    // 
    function clearWatch() {
        if (watchID !== null) {
            navigator.geolocation.clearWatch(watchID);
            watchID = null;
        }
    }

    // onError Callback receives a PositionError object
    //
    function onError(error) {
      alert('code: '    + error.code    + '\n' +
            'message: ' + error.message + '\n');
    }

function dbupdate()
{
var item1;	
if(runonce===0)
{
  
      //create record
      var gpswithstate={};
      gpswithstate=lastknowgoodpos;
      gpswithstate.state =getstate();
      item1 ={"record":[gpswithstate]}; 
        df.apis.localmongo.createRecords({"table_name":"Driverloc", "body":item1}, function (response) {
	  dbid=response.record[0]._id;//record created
      }, crudError
    );
 runonce+=1; 	
    }
 
 else
 {
      
   item1 = {timestamp:lastknowgoodpos.timestamp ,state:getstate(),latitude:lastknowgoodpos.latitude ,longitude:lastknowgoodpos.longitude ,accuracy:lastknowgoodpos.accuracy ,speed:lastknowgoodpos.speed };
  window.df.apis.localmongo.updateRecord({"table_name":"Driverloc",id:dbid,body:item1},function(response){
    console.log(response._id);
        
    }, crudError
    );
   
  }
  
  /////////////generic driver trail
  var trailwithstate={};
      trailwithstate=lastknowgoodpos;
      trailwithstate.state =getstate();
      var item2 ={"record":[trailwithstate]}; 
        df.apis.localmongo.createRecords({"table_name":"DriverTrail", "body":item2}, function (response) {
	  
      }, crudError
    );
  
}

function deletedriverloc()
{
  df.apis.localmongo.deleteRecords({"table_name":"Driverloc", "ids":dbid}, function (response) {
       
    }, crudError
    );
  //delete the driverloc record as it is meant for live drivers
} 


/////////////////////

window.onbeforeunload = function (evt) {
 var message = 'Logging Out';
if (typeof evt == 'undefined') {
 evt = window.event;

}
 if (evt ) {
   evt.returnValue = message;
   
 }

    return message;
	flogoutme();

}

///////////////////important note dreamfactory crud for mongodb
///////////create records => item = {"record":[gpsreq]};
///////////get records by filter => filter arguments jsonified
///////update records => update value as key:value pair no need to jsonify