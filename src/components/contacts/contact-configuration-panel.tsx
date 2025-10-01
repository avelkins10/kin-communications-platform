"use client";

import React, { useState, useEffect } from 'react';
import { ContactConfiguration, StalenessRules, StatusMappings, SLASettings } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Save, 
  RotateCcw, 
  Info,
  Clock,
  AlertTriangle,
  CheckCircle,
  Plus,
  Trash2
} from 'lucide-react';

interface ContactConfigurationPanelProps {
  onClose?: () => void;
  onSave?: (configuration: ContactConfiguration) => void;
}

export function ContactConfigurationPanel({ 
  onClose, 
  onSave 
}: ContactConfigurationPanelProps) {
  const [configuration, setConfiguration] = useState<ContactConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalConfig, setOriginalConfig] = useState<ContactConfiguration | null>(null);

  // Form state
  const [stalenessRules, setStalenessRules] = useState<StalenessRules>({
    activeTimeoutMonths: 6,
    holdTimeoutMonths: 3,
    enabled: true
  });
  const [statusMappings, setStatusMappings] = useState<StatusMappings>({
    activeStatuses: ['active', 'in_progress', 'pending', 'new'],
    inactiveStatuses: ['completed', 'cancelled', 'hold', 'inactive']
  });
  const [slaSettings, setSlaSettings] = useState<SLASettings>({
    voicemailCallback: {
      sameDayBefore3PM: true,
      nextBusinessDayAfter: true,
      enabled: true
    },
    textResponse: {
      businessHoursMinutes: 30,
      afterHoursNextDay9AM: true,
      enabled: true
    },
    missedCallFollowup: {
      hours: 1,
      enabled: true
    }
  });

  // Fetch current configuration
  useEffect(() => {
    fetchConfiguration();
  }, []);

  const fetchConfiguration = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/contacts/configurations');
      if (response.ok) {
        const data = await response.json();
        const config = data.current;
        setConfiguration(config);
        setOriginalConfig(config);
        
        if (config) {
          setStalenessRules(config.stalenessRules);
          setStatusMappings(config.statusMappings);
          setSlaSettings(config.slaSettings);
        }
      }
    } catch (error) {
      console.error('Error fetching configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const updatedConfig = {
        ...configuration,
        stalenessRules,
        statusMappings,
        slaSettings,
        updatedAt: new Date()
      };

      const response = await fetch(`/api/contacts/configurations${configuration?.id ? `?id=${configuration.id}` : ''}` , {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfig)
      });

      if (response.ok) {
        const savedConfig = await response.json();
        setConfiguration(savedConfig);
        setOriginalConfig(savedConfig);
        setHasChanges(false);
        onSave?.(savedConfig);
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (originalConfig) {
      setStalenessRules(originalConfig.stalenessRules);
      setStatusMappings(originalConfig.statusMappings);
      setSlaSettings(originalConfig.slaSettings);
      setHasChanges(false);
    }
  };

  const addStatusMapping = (type: 'active' | 'inactive', status: string) => {
    if (status.trim()) {
      if (type === 'active') {
        setStatusMappings(prev => ({
          ...prev,
          activeStatuses: [...prev.activeStatuses, status.trim()]
        }));
      } else {
        setStatusMappings(prev => ({
          ...prev,
          inactiveStatuses: [...prev.inactiveStatuses, status.trim()]
        }));
      }
      setHasChanges(true);
    }
  };

  const removeStatusMapping = (type: 'active' | 'inactive', index: number) => {
    if (type === 'active') {
      setStatusMappings(prev => ({
        ...prev,
        activeStatuses: prev.activeStatuses.filter((_, i) => i !== index)
      }));
    } else {
      setStatusMappings(prev => ({
        ...prev,
        inactiveStatuses: prev.inactiveStatuses.filter((_, i) => i !== index)
      }));
    }
    setHasChanges(true);
  };

  if (loading) {
    return (
      <Card className="w-full max-w-4xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading configuration...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Contact Configuration</span>
          </CardTitle>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={!hasChanges}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || saving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Staleness Rules */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Staleness Rules</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="activeTimeout">Active Contact Timeout (months)</Label>
              <Input
                id="activeTimeout"
                type="number"
                min="1"
                max="24"
                value={stalenessRules.activeTimeoutMonths}
                onChange={(e) => {
                  setStalenessRules(prev => ({
                    ...prev,
                    activeTimeoutMonths: parseInt(e.target.value) || 6
                  }));
                  setHasChanges(true);
                }}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="holdTimeout">Hold Contact Timeout (months)</Label>
              <Input
                id="holdTimeout"
                type="number"
                min="1"
                max="24"
                value={stalenessRules.holdTimeoutMonths}
                onChange={(e) => {
                  setStalenessRules(prev => ({
                    ...prev,
                    holdTimeoutMonths: parseInt(e.target.value) || 3
                  }));
                  setHasChanges(true);
                }}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="stalenessEnabled"
              checked={stalenessRules.enabled}
              onChange={(e) => {
                setStalenessRules(prev => ({
                  ...prev,
                  enabled: e.target.checked
                }));
                setHasChanges(true);
              }}
              className="rounded border-gray-300"
            />
            <Label htmlFor="stalenessEnabled">Enable staleness tracking</Label>
          </div>
        </div>

        {/* Status Mappings */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Status Mappings</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Active Statuses */}
            <div className="space-y-3">
              <Label>Active Statuses</Label>
              <div className="space-y-2">
                {statusMappings.activeStatuses.map((status, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Badge variant="default">{status}</Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeStatusMapping('active', index)}
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <div className="flex space-x-2">
                  <Input
                    placeholder="Add active status"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addStatusMapping('active', e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      addStatusMapping('active', input.value);
                      input.value = '';
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Inactive Statuses */}
            <div className="space-y-3">
              <Label>Inactive Statuses</Label>
              <div className="space-y-2">
                {statusMappings.inactiveStatuses.map((status, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Badge variant="secondary">{status}</Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeStatusMapping('inactive', index)}
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <div className="flex space-x-2">
                  <Input
                    placeholder="Add inactive status"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addStatusMapping('inactive', e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      addStatusMapping('inactive', input.value);
                      input.value = '';
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SLA Settings */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="text-lg font-semibold">SLA Settings</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Voicemail Callback */}
            <div className="space-y-3">
              <Label>Voicemail Callback</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={slaSettings.voicemailCallback.enabled}
                    onChange={(e) => {
                      setSlaSettings(prev => ({
                        ...prev,
                        voicemailCallback: {
                          ...prev.voicemailCallback,
                          enabled: e.target.checked
                        }
                      }));
                      setHasChanges(true);
                    }}
                    className="rounded border-gray-300"
                  />
                  <Label className="text-sm">Enabled</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={slaSettings.voicemailCallback.sameDayBefore3PM}
                    onChange={(e) => {
                      setSlaSettings(prev => ({
                        ...prev,
                        voicemailCallback: {
                          ...prev.voicemailCallback,
                          sameDayBefore3PM: e.target.checked
                        }
                      }));
                      setHasChanges(true);
                    }}
                    className="rounded border-gray-300"
                  />
                  <Label className="text-sm">Same day before 3 PM</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={slaSettings.voicemailCallback.nextBusinessDayAfter}
                    onChange={(e) => {
                      setSlaSettings(prev => ({
                        ...prev,
                        voicemailCallback: {
                          ...prev.voicemailCallback,
                          nextBusinessDayAfter: e.target.checked
                        }
                      }));
                      setHasChanges(true);
                    }}
                    className="rounded border-gray-300"
                  />
                  <Label className="text-sm">Next business day after</Label>
                </div>
              </div>
            </div>
            
            {/* Text Response */}
            <div className="space-y-3">
              <Label>Text Response</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={slaSettings.textResponse.enabled}
                    onChange={(e) => {
                      setSlaSettings(prev => ({
                        ...prev,
                        textResponse: {
                          ...prev.textResponse,
                          enabled: e.target.checked
                        }
                      }));
                      setHasChanges(true);
                    }}
                    className="rounded border-gray-300"
                  />
                  <Label className="text-sm">Enabled</Label>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Business hours response time (minutes)</Label>
                  <Input
                    type="number"
                    min="5"
                    max="1440"
                    value={slaSettings.textResponse.businessHoursMinutes}
                    onChange={(e) => {
                      setSlaSettings(prev => ({
                        ...prev,
                        textResponse: {
                          ...prev.textResponse,
                          businessHoursMinutes: parseInt(e.target.value) || 30
                        }
                      }));
                      setHasChanges(true);
                    }}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={slaSettings.textResponse.afterHoursNextDay9AM}
                    onChange={(e) => {
                      setSlaSettings(prev => ({
                        ...prev,
                        textResponse: {
                          ...prev.textResponse,
                          afterHoursNextDay9AM: e.target.checked
                        }
                      }));
                      setHasChanges(true);
                    }}
                    className="rounded border-gray-300"
                  />
                  <Label className="text-sm">Next day 9 AM after hours</Label>
                </div>
              </div>
            </div>
            
            {/* Missed Call Follow-up */}
            <div className="space-y-3">
              <Label>Missed Call Follow-up</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={slaSettings.missedCallFollowup.enabled}
                    onChange={(e) => {
                      setSlaSettings(prev => ({
                        ...prev,
                        missedCallFollowup: {
                          ...prev.missedCallFollowup,
                          enabled: e.target.checked
                        }
                      }));
                      setHasChanges(true);
                    }}
                    className="rounded border-gray-300"
                  />
                  <Label className="text-sm">Enabled</Label>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Follow-up time (hours)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="24"
                    value={slaSettings.missedCallFollowup.hours}
                    onChange={(e) => {
                      setSlaSettings(prev => ({
                        ...prev,
                        missedCallFollowup: {
                          ...prev.missedCallFollowup,
                          hours: parseInt(e.target.value) || 1
                        }
                      }));
                      setHasChanges(true);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Configuration Info */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Configuration Impact</p>
              <p>
                Changes to staleness rules will automatically recalculate the staleness status 
                for all contacts. SLA settings will update due dates for all active contacts. 
                Status mappings will affect how new contacts are categorized.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


