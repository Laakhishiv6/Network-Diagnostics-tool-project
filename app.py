from flask import Flask, jsonify, render_template, request
import speedtest
import json
import time
import subprocess
import platform
import socket
import requests
from urllib.request import urlopen
import threading
from datetime import datetime
import os

app = Flask(__name__)

class NetworkTools:
    @staticmethod
    def get_ip_info():
        """Get detailed IP information"""
        try:
            url = 'http://ipinfo.io/json'
            response = urlopen(url, timeout=10)
            data = json.load(response)
            
            return {
                "ip": data.get('ip', 'N/A'),
                "hostname": data.get('hostname', 'N/A'),
                "org": data.get('org', 'N/A'),
                "city": data.get('city', 'N/A'),
                "country": data.get('country', 'N/A'),
                "region": data.get('region', 'N/A'),
                "timezone": data.get('timezone', 'N/A'),
                "postal": data.get('postal', 'N/A'),
                "loc": data.get('loc', 'N/A')
            }
        except Exception as e:
            return {"error": f"IP info failed: {str(e)}"}

    @staticmethod
    def perform_speed_test():
        """Perform comprehensive speed test"""
        try:
            st = speedtest.Speedtest()
            st.get_best_server()
            
            # Test ping
            ping = st.results.ping
            
            # Test download speed
            download_speed = st.download() / 1_000_000
            
            # Test upload speed
            upload_speed = st.upload() / 1_000_000

            return {
                "ping": round(ping, 2),
                "download_speed": round(download_speed, 2),
                "upload_speed": round(upload_speed, 2),
                "server": st.best['name'],
                "server_country": st.best['country'],
                "server_sponsor": st.best['sponsor'],
                "server_distance": round(st.best['d'], 2)
            }
        except Exception as e:
            raise Exception(f"Speed test failed: {str(e)}")

    @staticmethod
    def ping_host(host="8.8.8.8", count=4):
        """Ping a host and return results"""
        try:
            param = "-n" if platform.system().lower() == "windows" else "-c"
            command = ["ping", param, str(count), host]
            result = subprocess.run(command, capture_output=True, text=True, timeout=30)
            
            return {
                "success": result.returncode == 0,
                "output": result.stdout,
                "error": result.stderr
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    def trace_route(host="google.com"):
        """Perform traceroute to a host"""
        try:
            param = "-d" if platform.system().lower() == "windows" else "-n"
            command = ["tracert" if platform.system().lower() == "windows" else "traceroute", param, host]
            result = subprocess.run(command, capture_output=True, text=True, timeout=60)
            
            return {
                "success": result.returncode == 0,
                "output": result.stdout,
                "error": result.stderr
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    def check_port(host="google.com", port=80):
        """Check if a port is open"""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(5)
            result = sock.connect_ex((host, port))
            sock.close()
            
            return {
                "host": host,
                "port": port,
                "open": result == 0,
                "status": "Open" if result == 0 else "Closed/Filtered"
            }
        except Exception as e:
            return {"error": str(e)}

    @staticmethod
    def dns_lookup(domain="google.com"):
        """Perform DNS lookup"""
        try:
            result = socket.getaddrinfo(domain, None)
            ips = list(set([addr[4][0] for addr in result]))
            
            return {
                "domain": domain,
                "ips": ips,
                "count": len(ips)
            }
        except Exception as e:
            return {"error": str(e)}

    @staticmethod
    def check_website_status(url="https://google.com"):
        """Check website availability and response time"""
        try:
            start_time = time.time()
            response = requests.get(url, timeout=10)
            end_time = time.time()
            
            return {
                "url": url,
                "status_code": response.status_code,
                "status": "Online" if response.status_code == 200 else "Issues",
                "response_time": round((end_time - start_time) * 1000, 2),
                "headers": dict(response.headers)
            }
        except Exception as e:
            return {"error": str(e)}

    @staticmethod
    def get_network_info():
        """Get local network information"""
        try:
            hostname = socket.gethostname()
            local_ip = socket.gethostbyname(hostname)
            
            return {
                "hostname": hostname,
                "local_ip": local_ip,
                "platform": platform.system(),
                "processor": platform.processor()
            }
        except Exception as e:
            return {"error": str(e)}

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/speedtest', methods=['GET'])
def api_speedtest():
    try:
        start_time = time.time()
        speed_results = NetworkTools.perform_speed_test()
        ip_info = NetworkTools.get_ip_info()
        network_info = NetworkTools.get_network_info()
        end_time = time.time()
        
        return jsonify({
            "ip_info": ip_info,
            "network_info": network_info,
            "speed_results": speed_results,
            "test_duration": round(end_time - start_time, 2),
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/ping', methods=['POST'])
def api_ping():
    try:
        data = request.get_json()
        host = data.get('host', '8.8.8.8')
        count = data.get('count', 4)
        
        result = NetworkTools.ping_host(host, count)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/traceroute', methods=['POST'])
def api_traceroute():
    try:
        data = request.get_json()
        host = data.get('host', 'google.com')
        
        result = NetworkTools.trace_route(host)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/portscan', methods=['POST'])
def api_portscan():
    try:
        data = request.get_json()
        host = data.get('host', 'google.com')
        port = data.get('port', 80)
        
        result = NetworkTools.check_port(host, port)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/dns', methods=['POST'])
def api_dns():
    try:
        data = request.get_json()
        domain = data.get('domain', 'google.com')
        
        result = NetworkTools.dns_lookup(domain)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/website', methods=['POST'])
def api_website():
    try:
        data = request.get_json()
        url = data.get('url', 'https://google.com')
        
        result = NetworkTools.check_website_status(url)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/networkinfo', methods=['GET'])
def api_networkinfo():
    try:
        ip_info = NetworkTools.get_ip_info()
        network_info = NetworkTools.get_network_info()
        
        return jsonify({
            "ip_info": ip_info,
            "network_info": network_info,
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)