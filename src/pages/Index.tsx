import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type BlockType = 'grass' | 'dirt' | 'stone' | 'wood' | 'leaves' | 'planks' | 'air';
type GameMode = 'survival' | 'creative';

interface Block {
  type: BlockType;
  x: number;
  y: number;
  z: number;
}

interface InventoryItem {
  type: BlockType;
  count: number;
  icon: string;
  color: string;
}

const BLOCK_SIZE = 40;
const WORLD_SIZE = 8;

const blockColors: Record<BlockType, string> = {
  grass: '#4CAF50',
  dirt: '#8B4513',
  stone: '#808080',
  wood: '#8B4513',
  leaves: '#228B22',
  planks: '#DEB887',
  air: 'transparent'
};

const blockTextures: Record<BlockType, string> = {
  grass: 'linear-gradient(135deg, #4CAF50 25%, #45a049 25%, #45a049 50%, #4CAF50 50%, #4CAF50 75%, #45a049 75%, #45a049)',
  dirt: 'linear-gradient(135deg, #8B4513 25%, #7a3a10 25%, #7a3a10 50%, #8B4513 50%, #8B4513 75%, #7a3a10 75%, #7a3a10)',
  stone: 'linear-gradient(135deg, #808080 25%, #707070 25%, #707070 50%, #808080 50%, #808080 75%, #707070 75%, #707070)',
  wood: 'linear-gradient(135deg, #6B3410 25%, #5a2d0e 25%, #5a2d0e 50%, #6B3410 50%, #6B3410 75%, #5a2d0e 75%, #5a2d0e)',
  leaves: 'linear-gradient(135deg, #228B22 25%, #1e7a1e 25%, #1e7a1e 50%, #228B22 50%, #228B22 75%, #1e7a1e 75%, #1e7a1e)',
  planks: 'linear-gradient(135deg, #DEB887 25%, #d4a373 25%, #d4a373 50%, #DEB887 50%, #DEB887 75%, #d4a373 75%, #d4a373)',
  air: 'transparent'
};

export default function Index() {
  const [world, setWorld] = useState<Block[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<BlockType>('grass');
  const [gameMode, setGameMode] = useState<GameMode>('creative');
  const [showInventory, setShowInventory] = useState(false);
  const [cameraRotation, setCameraRotation] = useState({ x: 30, y: 45 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const inventory: InventoryItem[] = [
    { type: 'grass', count: 64, icon: '🌱', color: '#4CAF50' },
    { type: 'dirt', count: 64, icon: '🟤', color: '#8B4513' },
    { type: 'stone', count: 64, icon: '⬜', color: '#808080' },
    { type: 'wood', count: 32, icon: '🪵', color: '#8B4513' },
    { type: 'leaves', count: 32, icon: '🍃', color: '#228B22' },
    { type: 'planks', count: 16, icon: '🪚', color: '#DEB887' }
  ];

  useEffect(() => {
    const initialWorld: Block[] = [];
    for (let x = 0; x < WORLD_SIZE; x++) {
      for (let z = 0; z < WORLD_SIZE; z++) {
        initialWorld.push({ type: 'grass', x, y: 0, z });
        if (Math.random() > 0.7) {
          initialWorld.push({ type: 'dirt', x, y: 1, z });
        }
      }
    }
    
    for (let i = 0; i < 3; i++) {
      const x = Math.floor(Math.random() * (WORLD_SIZE - 1));
      const z = Math.floor(Math.random() * (WORLD_SIZE - 1));
      initialWorld.push({ type: 'wood', x, y: 1, z });
      initialWorld.push({ type: 'wood', x, y: 2, z });
      initialWorld.push({ type: 'leaves', x, y: 3, z });
    }
    
    setWorld(initialWorld);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStart.current.x;
    const deltaY = e.clientY - dragStart.current.y;
    
    setCameraRotation(prev => ({
      x: Math.max(-90, Math.min(90, prev.x + deltaY * 0.3)),
      y: (prev.y + deltaX * 0.3) % 360
    }));
    
    dragStart.current = { x: e.clientX, y: e.clientY };
  }, [isDragging]);

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handleBlockClick = (x: number, y: number, z: number, isRightClick: boolean) => {
    if (isRightClick && selectedBlock !== 'air') {
      setWorld(prev => [...prev, { type: selectedBlock, x, y: y + 1, z }]);
    } else {
      setWorld(prev => prev.filter(b => !(b.x === x && b.y === y && b.z === z)));
    }
  };

  const get3DPosition = (x: number, y: number, z: number) => {
    const radX = (cameraRotation.x * Math.PI) / 180;
    const radY = (cameraRotation.y * Math.PI) / 180;
    
    const cosX = Math.cos(radX);
    const sinX = Math.sin(radX);
    const cosY = Math.cos(radY);
    const sinY = Math.sin(radY);
    
    const centerOffset = (WORLD_SIZE * BLOCK_SIZE) / 2;
    const px = (x * BLOCK_SIZE) - centerOffset;
    const py = -(y * BLOCK_SIZE);
    const pz = (z * BLOCK_SIZE) - centerOffset;
    
    const x1 = px * cosY + pz * sinY;
    const z1 = -px * sinY + pz * cosY;
    const y1 = py * cosX - z1 * sinX;
    const z2 = py * sinX + z1 * cosX;
    
    return {
      left: x1 + 300,
      top: y1 + 300,
      zIndex: Math.floor(1000 - z2)
    };
  };

  const sortedWorld = [...world].sort((a, b) => {
    const distA = a.x * a.x + a.y * a.y + a.z * a.z;
    const distB = b.x * b.x + b.y * b.y + b.z * b.z;
    return distB - distA;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-400 to-sky-200 overflow-hidden relative">
      <div className="absolute top-4 left-4 z-50 flex gap-2">
        <Card className="p-2 bg-black/70 border-gray-600">
          <div className="flex items-center gap-2">
            <Icon name="Gamepad2" className="text-white" size={20} />
            <span className="text-white font-semibold text-sm">Minecraft Mobile</span>
          </div>
        </Card>
        
        <Tabs value={gameMode} onValueChange={(v) => setGameMode(v as GameMode)}>
          <TabsList className="bg-black/70">
            <TabsTrigger value="creative" className="text-xs">
              <Icon name="Sparkles" size={14} className="mr-1" />
              Творчество
            </TabsTrigger>
            <TabsTrigger value="survival" className="text-xs">
              <Icon name="Heart" size={14} className="mr-1" />
              Выживание
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {gameMode === 'survival' && (
        <div className="absolute top-4 right-4 z-50 flex gap-2">
          <Card className="p-2 px-3 bg-black/70 border-red-600">
            <div className="flex items-center gap-2">
              <Icon name="Heart" className="text-red-500" size={18} />
              <span className="text-white font-semibold">20</span>
            </div>
          </Card>
          <Card className="p-2 px-3 bg-black/70 border-orange-600">
            <div className="flex items-center gap-2">
              <Icon name="Drumstick" className="text-orange-500" size={18} />
              <span className="text-white font-semibold">20</span>
            </div>
          </Card>
        </div>
      )}

      <div 
        ref={canvasRef}
        className="absolute inset-0 flex items-center justify-center cursor-grab active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{ perspective: '1000px' }}
      >
        <div className="relative" style={{ width: '600px', height: '600px' }}>
          {sortedWorld.map((block, idx) => {
            const pos = get3DPosition(block.x, block.y, block.z);
            return (
              <div
                key={idx}
                className="absolute transition-all duration-100 cursor-pointer hover:brightness-110 border-2 border-black/20"
                style={{
                  width: BLOCK_SIZE,
                  height: BLOCK_SIZE,
                  left: pos.left,
                  top: pos.top,
                  zIndex: pos.zIndex,
                  background: blockTextures[block.type],
                  boxShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                  transform: 'rotateX(45deg)'
                }}
                onClick={() => handleBlockClick(block.x, block.y, block.z, false)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  handleBlockClick(block.x, block.y, block.z, true);
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
              </div>
            );
          })}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 z-50">
        <Card className="bg-black/80 border-gray-700 p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Icon name="Package" className="text-white" size={20} />
              <span className="text-white font-semibold">Выбранный блок:</span>
              <Badge 
                className="text-white font-semibold px-3"
                style={{ backgroundColor: blockColors[selectedBlock] }}
              >
                {selectedBlock === 'grass' && '🌱 Трава'}
                {selectedBlock === 'dirt' && '🟤 Земля'}
                {selectedBlock === 'stone' && '⬜ Камень'}
                {selectedBlock === 'wood' && '🪵 Дерево'}
                {selectedBlock === 'leaves' && '🍃 Листва'}
                {selectedBlock === 'planks' && '🪚 Доски'}
              </Badge>
            </div>
            
            <Button 
              size="sm"
              variant="secondary"
              onClick={() => setShowInventory(!showInventory)}
              className="gap-2"
            >
              <Icon name="Backpack" size={18} />
              Инвентарь
            </Button>
          </div>
          
          {showInventory && (
            <div className="grid grid-cols-6 gap-2 mb-3 animate-fade-in">
              {inventory.map((item) => (
                <Button
                  key={item.type}
                  variant={selectedBlock === item.type ? "default" : "outline"}
                  className={`h-16 flex flex-col items-center justify-center gap-1 ${
                    selectedBlock === item.type ? 'ring-2 ring-white' : ''
                  }`}
                  style={selectedBlock === item.type ? { backgroundColor: item.color } : {}}
                  onClick={() => {
                    setSelectedBlock(item.type);
                    setShowInventory(false);
                  }}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-xs font-semibold">{item.count}</span>
                </Button>
              ))}
            </div>
          )}
          
          <div className="flex items-center justify-center gap-4">
            <Button
              size="lg"
              variant="destructive"
              className="flex-1 gap-2 h-14"
              onClick={() => {
                const centerBlock = world.find(b => 
                  b.x === Math.floor(WORLD_SIZE/2) && 
                  b.z === Math.floor(WORLD_SIZE/2) && 
                  b.y > 0
                );
                if (centerBlock) {
                  handleBlockClick(centerBlock.x, centerBlock.y, centerBlock.z, false);
                }
              }}
            >
              <Icon name="Trash2" size={22} />
              <span className="font-semibold">Разрушить</span>
            </Button>
            
            <Button
              size="lg"
              variant="default"
              className="flex-1 gap-2 h-14 bg-secondary hover:bg-secondary/90"
              onClick={() => {
                const centerX = Math.floor(WORLD_SIZE/2);
                const centerZ = Math.floor(WORLD_SIZE/2);
                const maxY = Math.max(...world.filter(b => b.x === centerX && b.z === centerZ).map(b => b.y), 0);
                handleBlockClick(centerX, maxY, centerZ, true);
              }}
            >
              <Icon name="Plus" size={22} />
              <span className="font-semibold">Построить</span>
            </Button>
          </div>
        </Card>
      </div>

      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-40">
        <div className="text-white text-4xl opacity-30">+</div>
      </div>
    </div>
  );
}
