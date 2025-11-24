class Tetromino {
    constructor(data){
	this.name = data?.name || '';
	this.color = data?.color || '#999999';
	this.image = data?.image || '';
	this.description = data?.description || '';
	this.matrix = Array.isArray(data?.matrix) ? data.matrix : [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
    }

    rowElement(){
	const tr = document.createElement('tr');
	let imageUrl = this.image || '';
	if (imageUrl && !imageUrl.startsWith('images/') && !imageUrl.startsWith('http')) {
	    imageUrl = 'images/' + imageUrl;
	}
	const imgTd = document.createElement('td');
	const img = document.createElement('img');
	img.src = imageUrl || '';
	img.alt = this.name;
	img.style.maxWidth = '80px';
	imgTd.appendChild(img);
	const nameTd = document.createElement('td');
	nameTd.textContent = this.name;
	const colorTd = document.createElement('td');
	const sw = document.createElement('span');
	sw.style.display = 'inline-block';
	sw.style.width = '24px';
	sw.style.height = '16px';
	sw.style.background = this.color;
	sw.style.border = '1px solid #ccc';
	colorTd.appendChild(sw);
	const descTd = document.createElement('td');
	descTd.textContent = this.description;
	const matrixTd = document.createElement('td');
	matrixTd.appendChild(this.matrixPreview());
	tr.appendChild(imgTd);
	tr.appendChild(nameTd);
	tr.appendChild(colorTd);
	tr.appendChild(descTd);
	tr.appendChild(matrixTd);
	return tr;
    }

    matrixPreview(){
	const wrap = document.createElement('div');
	wrap.style.display = 'inline-block';
	for (let r=0;r<4;r++){
	    const row = document.createElement('div');
	    row.style.display = 'flex';
	    for (let c=0;c<4;c++){
		const cell = document.createElement('div');
		cell.style.width = '12px';
		cell.style.height = '12px';
		cell.style.margin = '1px';
		cell.style.border = '1px solid #eee';
		if (this.matrix[r] && this.matrix[r][c]){
		    cell.style.background = this.color;
		}
		row.appendChild(cell);
	    }
	    wrap.appendChild(row);
	}
	return wrap;
    }

    save(){
	const payload = {
	    name: this.name,
	    color: this.color,
	    description: this.description,
	    image: this.image,
	    matrix: this.matrix
	};
	const xhr = new XMLHttpRequest();
	xhr.onload = function(){ getData(); };
	xhr.onerror = function(){ alert('Fout bij toevoegen van blok'); };
	xhr.open('POST', 'blocks.php', true);
	xhr.setRequestHeader('Content-Type','application/json');
	xhr.send(JSON.stringify(payload));
    }
}

function success(){
    let blocks = [];
    try{ blocks = JSON.parse(this.responseText); }catch(e){ console.error(e); }
    const tbody = document.querySelector('#outputTable tbody');
    tbody.innerHTML = '';
    if (Array.isArray(blocks)){
	blocks.forEach(b=>{ const block = new Tetromino(b); tbody.appendChild(block.rowElement()); });
    }
}

function error(err){ console.error('An error occurred:', err); }

function buildMatrixInputs(){
    const container = document.getElementById('matrixInputs');
    container.innerHTML = '';
    for (let r=0;r<4;r++){
	const row = document.createElement('div');
	row.style.display = 'flex';
	for (let c=0;c<4;c++){
	    const checkbox = document.createElement('input');
	    checkbox.type = 'checkbox';
	    checkbox.id = `m-${r}-${c}`;
	    checkbox.name = `m-${r}-${c}`;
	    checkbox.style.width = '18px';
	    checkbox.style.height = '18px';
	    row.appendChild(checkbox);
	}
	container.appendChild(row);
    }
}

function readMatrixFromInputs(){
    const matrix = [];
    for (let r=0;r<4;r++){
	const row = [];
	for (let c=0;c<4;c++){
	    const input = document.getElementById(`m-${r}-${c}`);
	    row.push(input && input.checked ? 1 : 0);
	}
	matrix.push(row);
    }
    return matrix;
}

function addBlock(e){
    e.preventDefault();
    const data = {
	name: document.getElementById('name').value.trim().toUpperCase(),
	color: document.getElementById('color').value,
	image: document.getElementById('image').value.trim(),
	description: document.getElementById('description').value.trim(),
	matrix: readMatrixFromInputs()
    };
    const block = new Tetromino(data);
    block.save();
    document.getElementById('newBlock').reset();
    buildMatrixInputs();
}

function getData(){
    const xhr = new XMLHttpRequest();
    xhr.onload = success;
    xhr.onerror = error;
    xhr.open('GET','blocks.php',true);
    xhr.send();
}

window.addEventListener('load', ()=>{ buildMatrixInputs(); getData(); document.getElementById('addButton').addEventListener('click', addBlock); });