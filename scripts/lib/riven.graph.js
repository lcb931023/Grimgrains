function Riven_Graph()
{
  Riven.call(this);

  var GRID_SIZE = 20

  this.el = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  document.body.appendChild(this.el)
  
  this.graph = function()
  {
    var html = "";
    for(id in this.network){
      var node = this.network[id];
      html += draw_routes(node);
    }
    for(id in this.network){
      var node = this.network[id];
      html += draw_node(node);
    }
    this.el.innerHTML = html;
  }

  function draw_routes(node)
  {
    var html = "";
    for(id in node.ports){
      var port = node.ports[id]
      var pos = port ? get_port_position(port) : {x:0,y:0}
      for(route_id in port.routes){
        var route = port.routes[route_id];
        if(!route){ continue; }
        html += route ? draw_connection(port,route) : ""
      }
    }
    return `<g id='routes'>${html}</g>`
  }

  function draw_node(node)
  {
    var rect = get_rect(node);

    return `
    <g class='node ${node.is_mesh ? 'mesh' : ''}' id='node_${node.id}'>
      <rect rx='2' ry='2' x=${rect.x} y=${rect.y-(GRID_SIZE/2)} width="${rect.w}" height="${rect.h}" class='${node.children.length == 0 ? "fill" : ""}'/>
      <text x="${rect.x+(rect.w/2)}" y="${rect.y+rect.h+(GRID_SIZE/2)}">${node.label}</text>
      ${draw_ports(node)}
      ${draw_glyph(node)}
    </g>`
  }

  function draw_ports(node)
  {
    var html = "";
    for(id in node.ports){
      html += draw_port(node.ports[id]);
    }
    return html
  }

  function draw_glyph(node)
  {
    var rect = get_rect(node);
    return !node.is_mesh ? `<path class='glyph' transform="translate(${rect.x+(GRID_SIZE/4)},${rect.y-(GRID_SIZE/4)}) scale(0.1)" d='${node.glyph}'/>` : ""
  }

  function draw_port(port)
  {
    var pos = port ? get_port_position(port) : {x:0,y:0}
    return `<g id='${port.host.id}_port_${port.id}'>${(port.type == PORT_TYPES.request || port.type == PORT_TYPES.answer)? `<path d='${draw_diamond(pos)}' class='port ${port.type} ${port.host.ports[id] && port.host.ports[id].route ? "route" : ""}' />` : `<circle cx='${pos.x}' cy="${pos.y}" r="${parseInt(GRID_SIZE/6)}" class='port ${port.type} ${port.host.ports[id] && port.host.ports[id].route ? "route" : ""}'/>`}</g>`
  }

  function draw_connection(a,b,type)
  {
    return a.type == PORT_TYPES.output ? draw_connection_output(a,b) : draw_connection_request(a,b)
  }

  function draw_connection_output(a,b)
  {
    var pos_a = get_port_position(a)
    var pos_b = get_port_position(b)
    var pos_m = middle(pos_a,pos_b)
    var pos_c1 = {x:(pos_m.x+(pos_a.x+GRID_SIZE))/2,y:pos_a.y}
    var pos_c2 = {x:(pos_m.x+(pos_b.x-GRID_SIZE))/2,y:pos_b.y}

    var path = ""

    path += `M${pos_a.x},${pos_a.y} L${pos_a.x+GRID_SIZE},${pos_a.y} `
    path += `Q${pos_c1.x},${pos_c1.y} ${pos_m.x},${pos_m.y} `
    path += `Q ${pos_c2.x},${pos_c2.y} ${pos_b.x-GRID_SIZE},${pos_b.y}`
    path += `L${pos_b.x},${pos_b.y}`

    return `<path d="${path}" class='route output'/>
    <circle cx='${pos_m.x}' cy='${pos_m.y}' r='2' fill='white'></circle>`
  }

  function draw_connection_request(a,b)
  {
    var pos_a = get_port_position(a)
    var pos_b = get_port_position(b)
    var pos_m = middle(pos_a,pos_b)
    var pos_c1 = {x:pos_a.x,y:(pos_m.y+(pos_a.y+GRID_SIZE))/2}
    var pos_c2 = {x:pos_b.x,y:(pos_m.y+(pos_b.y-GRID_SIZE))/2}

    var path = ""

    path += `M${pos_a.x},${pos_a.y} L${pos_a.x},${pos_a.y+GRID_SIZE} `
    path += `Q${pos_c1.x},${pos_c1.y} ${pos_m.x},${pos_m.y} `
    path += `Q ${pos_c2.x},${pos_c2.y} ${pos_b.x},${pos_b.y-GRID_SIZE}`
    path += `L${pos_b.x},${pos_b.y}`

    return `<path d="${path}" class='route request'/>
    <circle cx='${pos_m.x}' cy='${pos_m.y}' r='2' fill='white'></circle>`
  }
  
  function draw_diamond(pos)
  {
    var r = GRID_SIZE/6
    return `M${pos.x-(r)},${pos.y} L${pos.x},${pos.y-(r)} L${pos.x+(r)},${pos.y} L${pos.x},${pos.y+(r)} Z`
  }

  function get_port_position(port)
  {
    var rect = get_rect(port.host)
    var offset = {x:0,y:0}
    if(port.type == PORT_TYPES.output){
      offset = {x:GRID_SIZE*2,y:GRID_SIZE/2}
    }
    else if(port.type == PORT_TYPES.input){
      offset = {x:0,y:GRID_SIZE/2}
    }
    else if(port.type == PORT_TYPES.answer){
      offset = {x:GRID_SIZE,y:-GRID_SIZE*0.5}
    }
    else if(port.type == PORT_TYPES.request){
      offset = {x:GRID_SIZE,y:GRID_SIZE*1.5}
    }
    return {x:rect.x+offset.x,y:rect.y+offset.y}
  }

  function get_rect(node)
  {
    var rect = node.rect
    var x = node.rect.x * GRID_SIZE;
    var y = node.rect.y * GRID_SIZE;
    var w = node.rect.w * GRID_SIZE;
    var h = node.rect.h * GRID_SIZE;

    if(node.parent){
      var offset = get_rect(node.parent);
      x += offset.x;
      y += offset.y;
    }
    return {x:x,y:y,w:w,h:h}
  }

  function distance(a,b)
  {
    return Math.sqrt( (a.x - b.x)*(a.x - b.x) + (a.y - b.y)*(a.y - b.y) );
  }

  function diagonal(a,b)
  {
    return a.x == b.x || a.y == b.y || a.y - a.x == b.y - b.x || b.y - a.x == a.y - b.x
  }

  function middle(a,b)
  {
    return {x:(a.x+b.x)/2,y:(a.y+b.y)/2}
  }

  // Cursor

  this.cursor = {
    host:null,
    el:document.createElement("cursor"),
    pos:{x:0,y:0},
    offset:{x:0,y:0},
    origin:null,
    install: function(host){
      this.host = host;
      document.body.appendChild(this.el)
      document.addEventListener('mousedown',(e)=>{ this.touch({x:e.clientX,y:e.clientY},true); e.preventDefault(); });
      document.addEventListener('mousemove',(e)=>{ this.touch({x:e.clientX,y:e.clientY},false); e.preventDefault(); });
      document.addEventListener('mouseup',  (e)=>{ this.touch({x:e.clientX,y:e.clientY}); e.preventDefault(); });
    },
    update: function(){
      this.host.el.style.left = `${parseInt(this.offset.x)}px`;
      this.host.el.style.top = `${parseInt(this.offset.y)}px`;
      document.body.style.backgroundPosition = `${this.offset.x/2}px ${this.offset.y/2}px`;
    },
    touch: function(pos,click = null){
      if(click == true){
        this.origin = pos;
        return;
      }
      if(this.origin){
        this.offset.x += (pos.x - this.origin.x)/2;
        this.offset.y += (pos.y - this.origin.y)/2;
        this.update();
        this.origin = pos;
      }
      if(click == null){
        this.origin = null;
        return;
      }
      this.pos = pos;
    },
    magnet: function(val){
      return (parseInt(val/GRID_SIZE)*GRID_SIZE)+(GRID_SIZE/2);
    }
  }

  this.cursor.install(this);
}

var NODE_GLYPHS = {
  default: "M150,60 L150,60 L60,150 L150,240 L240,150 Z",
  router:"M60,120 L60,120 L150,120 L240,60 M60,150 L60,150 L240,150 M60,180 L60,180 L150,180 L240,240",
  parser:"M60,60 L60,60 L240,60 M120,120 A30,30 0 0,1 150,150 M150,150 A30,30 0 0,0 180,180 M180,180 L180,180 L240,180 M120,120 L120,120 L60,120 M60,240 L60,240 L240,240 M240,120 L240,120 L180,120 M60,180 L60,180 L120,180",
  entry:"M60,150 L60,150 L240,150 L240,150 L150,240 M150,60 L150,60 L240,150",
  bang:"M150,60 L150,60 L150,180 M150,240 L150,240 L150,240",
  value:"M60,60 L60,60 L240,60 L240,240 L60,240 Z M60,150 L60,150 L240,150",
  equal:"M60,60 L60,60 L240,60 M60,120 L60,120 L240,120 M60,180 L60,180 L240,180 M60,240 L60,240 L240,240",
  render:"M60,60 L60,60 L240,60 L240,240 L60,240 Z M240,150 L240,150 L150,150 L150,240",
  database:"M60,60 L60,60 L240,60 L240,240 L60,240 Z M120,120 L120,120 L180,120 M120,180 L120,180 L180,180 M120,150 L120,150 L180,150",
  cache:"M60,60 L60,60 L240,60 L240,240 L60,240 Z",
  builder:"M60,60 L60,60 L150,120 L240,120 M60,150 L60,150 L240,150 M60,240 L60,240 L150,180 L240,180",
  selector:"M90,60 L90,60 L60,60 L60,90 M60,210 L60,210 L60,240 L90,240 M210,240 L210,240 L240,240 L240,210 M240,90 L240,90 L240,60 L210,60",
  dom: "M150,60 L150,60 L60,150 L150,240 L240,150 Z",
  element: "M150,60 L150,60 L240,150 L150,240 L60,150 Z M120,150 L120,150 L180,150 M150,120 L150,120 L150,180",
}