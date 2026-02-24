ls
cd /home/deploy
ls
sudo mv /etc/nginx/sites-enabled/facture.logiciel-gfd.com.conf /etc/nginx/sites-enabled/facture.logiciel-gfd.com.conf.disabled
sudo systemctl reload nginx
ls -l /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/facture.logiciel-gfd.com.conf.disabled
sudo systemctl reload nginx
ls -l /etc/nginx/sites-enabled/
exit
sudo i
sudo -i
exit
sudo ln -s /etc/nginx/sites-available/facture.logiciel-gfd.com.conf /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/myapp /etc/nginx/sites-enabled/
sudo systemctl reload nginx
ls
pwd
cd /home/deploy
sudo tar -czvf facture-backend.tar.gz facture-backend
scp devadmin@194.164.77.52:/home/deploy/facture-backend.tar.gz .
exit
