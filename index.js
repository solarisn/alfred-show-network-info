'use strict';
const publicIp = require('public-ip');
const internalIp = require('internal-ip');
const defaultGateway = require('default-gateway');
const localDevices = require('local-devices');
const alfy = require('alfy');

const promises = [];
const output = [];

function addOutput(title, subtitle, arg, icon, action) {
	output.push({
		title: title,
		subtitle: subtitle,
		arg: arg,
		icon: {
			path: `${icon}.png`
		},
		variables: {
			action: action
		}
	})
}

function addIPOutput(type, ip, name, mac) {
	output.push({
		title: `${type}: ${ip} ${name ? `(${name})` : ''}`,
		subtitle: `${mac ? `MAC: ${mac} `  : ''}${process.env['show_actions'] === 'true' ? 'Actions: ⏎ to copy, ⌘⏎ to open, ⌥⏎ to ssh' : ''}`,
		arg: ip,
		mods: {
			cmd: {
				subtitle: 'Open in browser',
				arg: `http://${ip}`,
				variables: {
					action: 'browser'
				}
			},
			alt: {
				subtitle: 'Connect via SSH',
				arg: `${process.env['keyword']} ssh ${ip} `,
				variables: {
					action: 'rerun'
				}
			}
		},
		icon: {
			path: `${type}.png`
		},
		text: {
			copy: ip,
			largetype: ip
		},
		variables: {
			action: 'copy'
		}
	})
}

if (alfy.input.split(" ")[0].toLowerCase() === 'ssh') {
	addOutput(`Type ssh username for ${alfy.input.split(" ")[1]}`, `ssh ${alfy.input.split(" ")[2] || 'root'}@${alfy.input.split(" ")[1]}`, `ssh ${alfy.input.split(" ")[2] || 'root'}@${alfy.input.split(" ")[1]}`, 'Public', 'ssh')
} else if (alfy.input.toLowerCase() === 'scan') {
	promises.push(localDevices().then(devices => devices.forEach(device => addIPOutput('Device', device.ip, device.name, device.mac))).catch(() => addIPOutput('No local devices found', 'Local')));
} else if (alfy.input.toLowerCase() === 'ipv6') {
	if (process.env['show_public'] === 'true') promises.push(publicIp.v6().then(ip => addIPOutput('Public', ip, '', '')).catch(() => addIPOutput('Public', 'IPv6 not found', '', '')));
	if (process.env['show_local'] === 'true') promises.push(internalIp.v6().then(ip => addIPOutput('Local', ip, '', '')).catch(() => addIPOutput('Local', 'IPv6 not found', '', '')));
	if (process.env['show_gateway'] === 'true') promises.push(defaultGateway.v6().then(ip => addIPOutput('Gateway', ip.gateway, '', '')).catch(() => addIPOutput('Gateway', 'IPv6 not found', '', '')));
} else {
	if (process.env['show_public'] === 'true') promises.push(publicIp.v4().then(ip => addIPOutput('Public', ip, '', '')).catch(() => addIPOutput('Public', 'IPv4 not found', '', '')));
	if (process.env['show_local'] === 'true') promises.push(internalIp.v4().then(ip => addIPOutput('Local', ip, '', '')).catch(() => addIPOutput('Local', 'IPv4 not found', '', '')));
	if (process.env['show_gateway'] === 'true') promises.push(defaultGateway.v4().then(ip => addIPOutput('Gateway', ip.gateway, '', '')).catch(() => addIPOutput('Gateway', 'IPv4 not found', '', '')));
}

Promise.all(promises).then(() => {
	if (!alfy.input) {
		if (process.env['show_scan'] === 'true') addOutput('Scan for devices on local network', '', `${process.env['keyword']} scan`, 'Gateway', 'rerun');
		if (process.env['show_ipv6'] === 'true') addOutput('See IPv6 network info', '', `${process.env['keyword']} IPv6`, 'Gateway', 'rerun');
		if (process.env['show_contribute'] === 'true') addOutput('Contribute to this workflow', 'Development contributions are welcomed', 'https://github.com/jeppestaerk/alfred-show-network-info#contributions', 'icon', 'browser');
	}
	alfy.output(output)
});
