<?php

/* PUT data comes in on the stdin stream */
$putdata = fopen("php://input", "r");
$name = $_REQUEST['name'];
/* Open a file for writing */
$fp = fopen("files/".$name, "w");
if($fp){
    while ($data = fread($putdata,1024))
    fwrite($fp, $data);
    /* Close the streams */
    fclose($fp);
    fclose($putdata);
    //unlink("files/".$name);
    
}else{
    die("can't open file to write");
}
echo '/files/'.$name;
?>

