const API_BASE = './blocks.php';

class Tetromino {
	constructor({name, color, description, image, matrix}) {
		this.name = String(name || '').toUpperCase();
		this.color = color || '#999999';
		this.description = description || '';
		this.image = image || '';
		this.matrix = Array.isArray(matrix) ? matrix : [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
	}

	static fromJSON(obj){
		return new Tetromino(obj);
	}

	createPreview(size = 4, cellSize = 12){
		const wrap = document.createElement('div');
		wrap.className = 'matrix-preview';
		wrap.style.setProperty('--cell-size', cellSize + 'px');

		for (let r=0;r<4;r++){
			const row = document.createElement('div');
			row.className = 'matrix-row';
			for (let c=0;c<4;c++){
				const cell = document.createElement('div');
				cell.className = 'matrix-cell';
				if (this.matrix[r] && this.matrix[r][c]){
					cell.style.backgroundColor = this.color;
				}
				row.appendChild(cell);
			}
			wrap.appendChild(row);
		}
		return wrap;
	}
}

const api = {
	async fetchAll(){
		const res = await fetch(API_BASE);
		if (!res.ok) throw new Error('Failed to fetch blocks');
		const data = await res.json();
		return data.map(d => Tetromino.fromJSON(d));
	},

	async fetchDetail(name){
		const url = API_BASE + '?block=' + encodeURIComponent(name);
		const res = await fetch(url);
		if (!res.ok) throw new Error('Block not found');
		const data = await res.json();
		return Tetromino.fromJSON(data);
	},

	async create(block){
		const res = await fetch(API_BASE, {
			method: 'POST',
			headers: {'Content-Type':'application/json'},
			body: JSON.stringify(block),
		});
		if (!res.ok) {
			const err = await res.json().catch(()=>({error:'unknown'}));
			throw new Error(err.error || 'Failed to create block');
		}
		const created = await res.json();
		return Tetromino.fromJSON(created);
	}
};

const state = {blocks: []};

function el(tag, props={}, ...children){
	const e = document.createElement(tag);
	for (const k in props){
		if (k === 'class') e.className = props[k];
		else if (k.startsWith('on') && typeof props[k] === 'function') e.addEventListener(k.slice(2).toLowerCase(), props[k]);
		else e.setAttribute(k, props[k]);
	}
	for (const c of children) if (c) e.append(c);
	return e;
}

function renderGrid(container){
	container.innerHTML = '';
	const grid = document.createElement('div');
	grid.className = 'cards';

	state.blocks.forEach(block => {
		const card = el('article', {class: 'card', tabindex:0});
		const header = el('div',{class:'card-header'}, el('strong',{}, block.name));
		const preview = block.createPreview();
		const img = block.image ? el('img',{src:block.image, alt:block.name, class:'card-img'}) : null;
		const desc = el('p',{class:'card-desc'}, block.description);
		const meta = el('div',{class:'card-meta'}, el('span',{}, block.color));

		card.appendChild(header);
		if (img) card.appendChild(img);
		card.appendChild(preview);
		card.appendChild(desc);
		card.appendChild(meta);

		card.addEventListener('click', ()=> showDetail(block.name));
		card.addEventListener('keydown', (ev)=> { if(ev.key==='Enter') showDetail(block.name); });

		grid.appendChild(card);
	});

	container.appendChild(grid);
}

async function showDetail(name){
	const aside = document.getElementById('detail');
	aside.innerHTML = '<p>Laden…</p>';
	try{
		const block = await api.fetchDetail(name);
		aside.innerHTML = '';
		const title = el('h2',{}, block.name);
		const preview = block.createPreview(4,20);
		const img = block.image ? el('img',{src:block.image, alt:block.name, class:'detail-img'}) : null;
		const desc = el('p',{}, block.description);
		const color = el('p',{}, 'Kleur: ', el('span',{class:'color-swatch', style:`background:${block.color}`}, ' '));

		aside.appendChild(title);
		if (img) aside.appendChild(img);
		aside.appendChild(preview);
		aside.appendChild(desc);
		aside.appendChild(color);
	}catch(err){
		aside.innerHTML = '<p class="error">Kon details niet laden.</p>';
	}
}

function buildMatrixInputs(container){
	container.innerHTML = '';
	for (let r=0;r<4;r++){
		const row = document.createElement('div'); row.className='matrix-row-input';
		for (let c=0;c<4;c++){
			const id = `m-${r}-${c}`;
			const label = document.createElement('label');
			label.className='matrix-checkbox';
			const checkbox = document.createElement('input');
			checkbox.type='checkbox'; checkbox.name=id; checkbox.value='1';
			label.appendChild(checkbox);
			row.appendChild(label);
		}
		container.appendChild(row);
	}
}

function readMatrixFromInputs(container){
	const matrix = [];
	for (let r=0;r<4;r++){
		const row = [];
		for (let c=0;c<4;c++){
			const input = container.querySelector(`input[name="m-${r}-${c}"]`);
			row.push(input && input.checked ? 1 : 0);
		}
		matrix.push(row);
	}
	return matrix;
}

function showAddForm(){
	document.getElementById('add-form-panel').classList.remove('hidden');
}

function hideAddForm(){
	document.getElementById('add-form-panel').classList.add('hidden');
}

async function init(){
	const gridContainer = document.getElementById('grid');
	const matrixInputs = document.getElementById('matrix-inputs');
	buildMatrixInputs(matrixInputs);

	document.getElementById('show-add-form').addEventListener('click', showAddForm);
	document.getElementById('cancel-add').addEventListener('click', (e)=>{ hideAddForm(); });

	document.getElementById('add-form').addEventListener('submit', async (ev)=>{
		ev.preventDefault();
		const form = ev.target;
		const fd = new FormData(form);
		const name = (fd.get('name')||'').toString().trim().toUpperCase();
		const color = fd.get('color')||'#999999';
		const description = fd.get('description')||'';
		const image = fd.get('image')||'';
		const matrix = readMatrixFromInputs(matrixInputs);

		const payload = {name, color, description, image, matrix};

		try{
			const created = await api.create(payload);
			state.blocks.push(created);
			renderGrid(gridContainer);
			hideAddForm();
			form.reset();
			buildMatrixInputs(matrixInputs);
			showDetail(created.name);
		}catch(err){
			alert('Fout bij toevoegen: ' + err.message);
		}
	});

	try{
		state.blocks = await api.fetchAll();
		renderGrid(gridContainer);
	}catch(err){
		gridContainer.innerHTML = '<p class="error">Kon blokken niet laden.</p>';
	}
}

document.addEventListener('DOMContentLoaded', init);