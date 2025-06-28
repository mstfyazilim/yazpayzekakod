<?php
$host = "localhost";
$db = "obs";
$user = "root";
$pass = "";

try {
  $conn = new PDO("mysql:host=$host;dbname=$db", $user, $pass);
  $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
  echo "Bağlantı başarılı";
} catch (PDOException $e) {
  echo "Bağlantı hatası: " . $e->getMessage();
}
?>
