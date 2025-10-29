/**
 * Event Code Legend Component
 * Shows all event codes with descriptions and occurrence counts
 */

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, AlertCircle, CheckCircle, Shield, Activity, CreditCard, Zap } from 'lucide-react';
import { EVENT_CODES, type EventCode, searchEventCodes } from '@/lib/eventCodes';

export default function EventCodeLegend() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCodes, setFilteredCodes] = useState<EventCode[]>(Object.values(EVENT_CODES));

  useEffect(() => {
    if (searchTerm.trim()) {
      setFilteredCodes(searchEventCodes(searchTerm));
    } else {
      setFilteredCodes(Object.values(EVENT_CODES));
    }
  }, [searchTerm]);

  const getCategoryIcon = (category: EventCode['category']) => {
    switch (category) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'security':
        return <Shield className="h-4 w-4 text-purple-500" />;
      case 'system':
        return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: EventCode['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    }
  };

  // Group codes by prefix
  const groupedCodes = filteredCodes.reduce((acc, code) => {
    const prefix = code.code.split('-')[0];
    if (!acc[prefix]) acc[prefix] = [];
    acc[prefix].push(code);
    return acc;
  }, {} as Record<string, EventCode[]>);

  const prefixNames: Record<string, { name: string; icon: JSX.Element }> = {
    'GEN': { name: 'Generation Events', icon: <Zap className="h-5 w-5" /> },
    'CVT': { name: 'Conversion Events', icon: <Activity className="h-5 w-5" /> },
    'DBG': { name: 'Debug Events', icon: <AlertCircle className="h-5 w-5" /> },
    'SEC': { name: 'Security Events', icon: <Shield className="h-5 w-5" /> },
    'CRD': { name: 'Credit Events', icon: <CreditCard className="h-5 w-5" /> },
    'N8N': { name: 'n8n Integration', icon: <Activity className="h-5 w-5" /> },
    'USR': { name: 'User Actions', icon: <Activity className="h-5 w-5" /> },
    'SYS': { name: 'System Events', icon: <Activity className="h-5 w-5" /> }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search event codes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Legend */}
      <ScrollArea className="h-[600px]">
        <div className="space-y-6">
          {Object.entries(groupedCodes).map(([prefix, codes]) => (
            <div key={prefix}>
              <div className="flex items-center gap-2 mb-3">
                {prefixNames[prefix]?.icon}
                <h3 className="text-lg font-semibold">{prefixNames[prefix]?.name || prefix}</h3>
                <Badge variant="secondary">{codes.length}</Badge>
              </div>

              <div className="space-y-2">
                {codes.map((eventCode) => (
                  <Card key={eventCode.code} className="p-4">
                    <div className="flex items-start gap-3">
                      {getCategoryIcon(eventCode.category)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <code className="text-sm font-mono font-semibold">{eventCode.code}</code>
                          <Badge className={`text-xs ${getSeverityColor(eventCode.severity)}`}>
                            {eventCode.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {eventCode.description}
                        </p>
                        {eventCode.actionRequired && (
                          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded p-2 mt-2">
                            <p className="text-xs text-blue-800 dark:text-blue-400">
                              <strong>Action Required:</strong> {eventCode.actionRequired}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}

          {filteredCodes.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No event codes found matching "{searchTerm}"</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Summary */}
      <Card className="p-4 bg-muted">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-green-600">{Object.values(EVENT_CODES).filter(e => e.category === 'success').length}</p>
            <p className="text-xs text-muted-foreground">Success</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-600">{Object.values(EVENT_CODES).filter(e => e.category === 'warning').length}</p>
            <p className="text-xs text-muted-foreground">Warnings</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600">{Object.values(EVENT_CODES).filter(e => e.category === 'error').length}</p>
            <p className="text-xs text-muted-foreground">Errors</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-600">{Object.values(EVENT_CODES).filter(e => e.category === 'security').length}</p>
            <p className="text-xs text-muted-foreground">Security</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
