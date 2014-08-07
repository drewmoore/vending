Vending Machine
===============

If only it were the real thing...
---------------------------------

Deployment Instructions:
------------------------

+ Run git clone https://github.com/drewmoore/vending.
+ If you don't already have Vagrant installed, Run sudo apt-get install vagrant (Requires VirtualBox).
+ Run vagrant box add hashicorp/precise64 http://files.vagrantup.com/precise64.box.
+ Run vagrant up.

+ Vagrant's virtual box will download and install the necessary repositories and run the test suite.  
+ When the Node server is running, load http://127.0.0.1:4567/ into your browser.
