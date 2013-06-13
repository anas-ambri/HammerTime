//TODO this file is becoming a mess, clean it up using the method explained here: 
//  http://viget.com/inspire/extending-paul-irishs-comprehensive-dom-ready-execution

var GLOBAL_PARAMETERS = 
{
	"left_arm_min" : 8,
	"right_arm_min" : 8,
	"left_arm_max" : 10,
	"right_arm_max" : 10,
	"Mg_ion_mM": 1,
	"salt_ion_mM":150, //[Na]+[K]
	"oligomer_nM":200
}


//NOTE: All the String methods were moved to client_utils.js
//FileLoader is defined in client_utils.js
var fileLoader = new FileLoader();

//Fetch from database
function FetchAccessionNumberSequence()
{
    var accessionAlert = $("#accession_alert");
    accessionAlert.removeClass("invisible alert-error alert-success");
    accessionAlert.text("Searching our database...");
    var sequence = $("#accession").find("input").val();
    var url = "http://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi";
    $.ajax({
        type: "GET",
        url: url,
        data: {
            db: 'nuccore',
            'id': sequence,
            rettype: 'fasta',
            retmode: 'text'
        },
        success: function(d) {
            if( setDisplay(d.toString())){
               $("#submit1").removeClass("disabled");              
            }
            accessionAlert.addClass("alert-success");
            accessionAlert.text("Sequence found!");
        },
        error: function(jqXHR, textStatus, errorThrown) {
            setDisplay("");
            accessionAlert.removeClass("alert-success");
            accessionAlert.addClass("alert-error");
            accessionAlert.text("No results found for this accession number")
        }
    });
}

function ValidateInput(input)
{
    var badInput = false;
    var Problems = '';
    var isRNA = true;

    if(input == "")
            return {"ok" : false , "error" : "Empty Input: Is your FASTA comment terminated by a new line?"};

    for(var ii = 0; ii < input.length; ++ii)
    {
            if(input[ii] ==' ' || input[ii] =='\n')
                    continue;
            if(input[ii] != 'T' && input[ii] != 'U' && input[ii] != 'G' && input[ii] != 'C' && input[ii] != 'A')
            {
                    Problems = "Unrecognized nucleotide: " + input[ii];
                    badInput = true;
                    break;		
            }
    }

    if(badInput)
            return {"ok" : false , "error" :Problems};

            for(var ii = 0; ii < input.length; ++ii)
    {
            if(input[ii] ==' ')
                    continue;
            if(input[ii] == 'T')
            {
                    isRNA = false;
                    break;
            }
    }
    for(var ii = 0; ii < input.length; ++ii)
    {
            if(input[ii] ==' ' || input[ii] == '\n')
                    continue;
            if((isRNA && input[ii] =='T') || (!isRNA && input[ii] == 'U'))
            {
                    console.log("@" + ii + ":" + input[ii]);
                    Problems = "Inconsistent input (T and U): Check that your input is either DNA or RNA";
                    badInput = true;
                    break;
            }
    }

    if(badInput)
            return {"ok" : false , "error" :Problems};

    return {"ok" : true, "error" : "All OK!" };
	
}

function setDisplay(str){
    var sequenceAlert = $("#sequence_alert");
    $("#submit1").addClass("disabled");
    sequenceAlert.addClass("invisible");
    sequenceAlert.removeClass("alert-error");
    
    $("#sequence-display")[0].value = str;
    if(str !== ""){
        return validateAndAlert(str);
    }
}

function validateAndAlert(str){
    var sequenceAlert = $("#sequence_alert");
    var input = CleanInput(str);
    var validation = ValidateInput(input);
    sequenceAlert.removeClass("invisible");
    if(validation.ok === false){
      sequenceAlert.addClass("alert-error");
      sequenceAlert.removeClass("alert-success");
    }
    else{
      sequenceAlert.removeClass("alert-error");
      sequenceAlert.addClass("alert-success");        
    }
            
    sequenceAlert.text(validation.error);
    
    return validation.ok;
}

function CleanInput( input )
{
    //FASTA
    input = input.toUpperCase();
    input = input.trim();
    var fastaCommentStart = input.indexOfMultiple(['>' , ';']);
    do
    {
            if(fastaCommentStart != -1 )
            {
                    var endofFastaComment =  input.indexOf('\n');
                    if(endofFastaComment > fastaCommentStart)
                    {
                            if( endofFastaComment != -1 )
                            {
                                    input = input.substr( input.indexOf('\n') + 1);
                            }
                    }
                    else //This means the comment is not terminated by a new-line. The entire thing is garbage. The validator will scream
                    { //Or is preceeded by a line break, which means it is not proper FASTA
                            input = "";
                            break;
                    }
            }
            fastaCommentStart = input.indexOfMultiple(['>' , ';']);
    } while(fastaCommentStart != -1 );
    //END FASTA

    input = input.replace(/[ \t\r\n]+/g, '');//This removes all white-space from the returned string
    return input;
}


function SubmitInput()
{
//    var csites = FindCutsites (input);
//    var candidates = CreateCandidates(input, csites);
//    ShowCandidatesAndAnnealing(candidates);
    var input = CleanInput($('#sequence-display')[0].value);
    $.ajax({
        type: "POST",
        url: window.location.href+"design",
        data: {
            sequence: input
        },
        success: function(data) {
            window.location.href = window.location.href+"design/"+data.id;
        },
        error: function(jqXHR, textStatus, errorThrown) {
            $("#sequence_alert").text("Can't connect to our server. Try again later...")
        }
    });
}

function clearInput(){
    setDisplay("");
    $('#accession').val("");
    $("#accession_alert").addClass("invisible");
}

function FindCutsites( seq )
{
	var loc = new Array();
	res = -1;
	do
	{
		res = seq.indexOf("GUC", res + 1);
		if(res !== -1)
			loc.push(res);
	}
	while (res !== -1);
	return loc;
}

function PrintSequenceWithCutSitesHighlited(seq,cutSites)
{
	var htmlInsert ="";
	var last = 0;
	for(var ii = 0; ii < cutSites.length; ++ii)
	{
		htmlInsert += seq.substr(last, cutSites[ii]);
		htmlInsert += "<b><span class='cut-site'>GUC</span></b>";
		last = cutSites[ii]+3;
	}
	htmlInsert+= seq.substr (last);
	$('.displayUpdate').html( htmlInsert );
}

var cc;
function CreateCandidates (seq, cutSites)
{
	var Candidates = new Array();
	//Per cutsite
	//Load params
	var lamin = GLOBAL_PARAMETERS.left_arm_min;
	var ramin = GLOBAL_PARAMETERS.right_arm_min;
	var lamax = GLOBAL_PARAMETERS.left_arm_max;
	var ramax = GLOBAL_PARAMETERS.right_arm_max;
	
	for(var ii = 0 ; ii < cutSites.length;++ii)
	{
		var firstCutsiteCands = new Array();
		for(var jj = lamin; jj < lamax; ++jj)
		{
			var start = cutSites[ii] - jj;
			if(start < 0)
				continue;
			for(var kk = ramin; kk < ramax; ++kk)
			{
				var end = cutSites[ii]+3+kk;
				var length = end - start;
				if(end >= seq.length)
					continue;
				firstCutsiteCands.push({"seq" : seq.substr(start,length), "cut":(jj+2)});
				
			}
		}
		Candidates.push(firstCutsiteCands);
	}
	cc = Candidates;
	return Candidates;
}

function ShowCandidatesAndAnnealing(cands)
{
	var res = "";
	var consRes = "";
	for(var ii = 0; ii < cands.length; ++ii)
	{
		res += "<p>Cut site number " + ii + "</p>";
		consRes += "Cut site number " + ii + "\n";
		for(var jj = 0; jj < cands[ii].length; ++jj)
		{
			var currentSeq = cands[ii][jj].seq;
			console.log(currentSeq);
			var c_pos = cands[ii][jj].cut;
			currentSeq = currentSeq.substr(0,c_pos)+currentSeq.substr(c_pos+1,currentSeq.length-c_pos-1);//REMOVE non-annealing C from comupation
			console.log(currentSeq);
			var computationalResult = tm_Base_Stacking(cands[ii][jj].seq.replaceAll('U','T'),GLOBAL_PARAMETERS.oligomer_mM,GLOBAL_PARAMETERS.salt_ion_mM,GLOBAL_PARAMETERS.Mg_ion_mM);
			res += "<p>\t"+cands[ii][jj].seq + "\t"+ computationalResult+'</p>';
			consRes += "\t"+cands[ii][jj].seq + "\t"+ computationalResult+'\n';
		}
	}
	console.log(consRes)
	$('.displayUpdate').html(res);
}

function showDesignHelp(){
    
}

window.onload = function() {
    $('#submit_ACN').click(FetchAccessionNumberSequence);
    $('#submit1').click(SubmitInput);
    $('#reset').click(clearInput);
    
    var dropZone = $("#drop-zone")[0];
    dropZone.addEventListener('dragover', fileLoader.handleDragOver, false);
    dropZone.addEventListener('drop', fileLoader.handleFileSelect, false);
    
    $('#sequence-display').bind('input propertychange', function() {
        validateAndAlert($('#sequence-display')[0].value)?
            $("#submit1").removeClass("disabled"):
                    $("#submit1").addClass("disabled");
    });
    
    $(".icon-question-sign").click(showDesignHelp);
};