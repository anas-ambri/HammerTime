var test_basestalk = new UnitTest();
//Fetched lots of info with a 50nM, 50mM, 0mM settings for concentration, salts and Mg respectively.
test_basestalk.AddNew(["GGGCCTACAGTCCTTGGCGCGGC",50,50,0],67);
test_salt_adjusted.AddNew(["GGGCCTACAGTCCTTGGCGCGGC",50],66);
//IDT 	66.9 �C  -> Unknown
//OligoCalc: 66, 73.6,64.76 ->Basic, Salt Adj, Nearest Neigh
//Biophp: 66, 66.9 -> Basic, base-stacking
//BioMath:66, 61, 67 ->Basic, salt adj, base-stacking
//Us:65.815

test_basestalk.AddNew(["TGTTTTACACCCTTCGAA",50,50,0],47);
test_basestalk.AddNew(["TGTTTTACACCCTTCGAA",50],43.5);
//Oligo: 43.5,49.3,44.89
//IDT: 46.5
//BioPhP: 43.5, 46.5
//BioMath: 43, 38, 47
//Us: 46.521

test_basestalk.AddNew(["TTCTCTGAACGT",50,50,0],32);
test_basestalk.AddNew(["TTCTCTGAACGT",50],34);
//Oligo: 34,34,28.76
//IDT: 32.1
//BioPhP: 34, 31.7
//BioMath: 34,21,32
//Us: 31.660

test_basestalk.AddNew(["ACCAAGATAGGTATGTTCATCGAAG",50,50,0],52.6);
test_basestalk.AddNew(["ACCAAGATAGGTATGTTCATCGAAG",50],54.4);
//Oligo:54.4, 62.5, 54.59
//IDT:52.6
//BioPHP:54.4,53.3
//BioMath: 54, 49, 53
//US: 53.598

test_basestalk.AddNew(["CTCGGCCGAAGGA",50,50,0],47);
test_basestalk.AddNew(["CTCGGCCGAAGGA",50],44);
//Oligo:44,44,43.71
//IDT:47
//BioPHP: 44, 44.5
//BioMath: 44, 36, 46
//Us:45.221

//TODO: Find some sort of test_basestalk for the data..
console.log(test_basestalk.Execute(tm_Base_Stacking,2));
function create_random_oligomer()
{
	var l = Math.round(Math.random()*15 + 10);
	var arr = new Array();
	for(var ii = 0; ii < l; ++ii)
	{
		var pick = Math.floor((Math.random()*4));
		switch(pick)
		{
			case 0:
				arr.push('G');
				break;
			case 1:
				arr.push('C');
				break;
			case 2:
				arr.push('T');
				break;
			case 3:
				arr.push('A');
				break;
		}
	}
	return arr.join('');
	
}
