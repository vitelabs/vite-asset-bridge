set -e

pwd
rm -rf testing-integration/data.0
rm -rf testing-integration/data.1
rm -rf testing-integration/data.2

mkdir testing-integration/data.0
mkdir testing-integration/data.1
mkdir testing-integration/data.2

mkdir testing-integration/data.0/.channel_vite
mkdir testing-integration/data.0/.channel_ether
mkdir testing-integration/data.1/.channel_vite
mkdir testing-integration/data.1/.channel_ether
mkdir testing-integration/data.2/.channel_vite
mkdir testing-integration/data.2/.channel_ether

python3 testing-integration/bridge.test.py

# clear
rm -rf testing-integration/data.0
rm -rf testing-integration/data.1
rm -rf testing-integration/data.2
