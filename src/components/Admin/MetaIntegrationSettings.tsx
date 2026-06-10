import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../store/useStore';
import { Save, Plus, Trash2, Webhook } from 'lucide-react';

export const MetaIntegrationSettings: React.FC = () => {
  const [accessToken, setAccessToken] = useState('');
  const [verifyToken, setVerifyToken] = useState('');
  const [formMappings, setFormMappings] = useState<Record<string, { databaseId: string }>>({});
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { databases, setToastMessage } = useStore();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Since RLS policies handle creation via the initialize_integrations_settings RPC
        // We will just select it
        const { data, error } = await supabase
          .from('integrations_settings')
          .select('meta_access_token, meta_verify_token, form_mappings, field_mappings')
          .single();

        if (error) {
           console.error("Error fetching settings:", error);
           return;
        }

        if (data) {
          setAccessToken(data.meta_access_token || '');
          setVerifyToken(data.meta_verify_token || '');
          setFormMappings(data.form_mappings || {});
          setFieldMappings(data.field_mappings || {});
        }
      } catch (err) {
        console.error('Failed to load Meta settings:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('integrations_settings')
        .update({
          meta_access_token: accessToken,
          meta_verify_token: verifyToken,
          form_mappings: formMappings,
          field_mappings: fieldMappings,
          updated_at: new Date().toISOString()
        })
        .eq('id', (await supabase.from('integrations_settings').select('id').single()).data?.id); // Safe assuming single row

      if (error) throw error;
      setToastMessage('Meta integration settings saved successfully');
    } catch (err) {
      console.error('Error saving Meta settings:', err);
      setToastMessage('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const addFormMapping = () => {
    const newFormId = `form_${Math.random().toString(36).substr(2, 6)}`;
    setFormMappings(prev => ({
      ...prev,
      [newFormId]: { databaseId: databases[0]?.id || '' }
    }));
  };

  const updateFormMapping = (oldFormId: string, newFormId: string, databaseId: string) => {
    setFormMappings(prev => {
      const newMappings = { ...prev };
      if (oldFormId !== newFormId) {
        delete newMappings[oldFormId];
      }
      newMappings[newFormId] = { databaseId };
      return newMappings;
    });
  };

  const deleteFormMapping = (formId: string) => {
    setFormMappings(prev => {
      const newMappings = { ...prev };
      delete newMappings[formId];
      return newMappings;
    });
  };

  const updateFieldMapping = (metaField: string, columnKey: string) => {
    setFieldMappings(prev => ({
      ...prev,
      [metaField]: columnKey
    }));
  };

  const deleteFieldMapping = (metaField: string) => {
    setFieldMappings(prev => {
      const newMappings = { ...prev };
      delete newMappings[metaField];
      return newMappings;
    });
  };

  const addFieldMapping = () => {
    setFieldMappings(prev => ({
      ...prev,
      '': ''
    }));
  };

  // Extract all columns across all databases for the dropdown
  const allColumns = databases.flatMap(db => db.columns);

  if (isLoading) return <div className="p-4">Loading settings...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 text-blue-500 mb-4">
        <Webhook className="w-5 h-5" />
        <h3 className="text-lg font-semibold">Meta Lead Forms Integration</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Meta App Verify Token
          </label>
          <input
            type="text"
            value={verifyToken}
            onChange={(e) => setVerifyToken(e.target.value)}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="A custom string to verify your webhook"
          />
          <p className="text-xs text-gray-500 mt-1">Provide this token when setting up the webhook in the Meta App Dashboard.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Meta App / System User Access Token
          </label>
          <input
            type="password"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Required to fetch lead details"
          />
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-md font-medium text-gray-800 dark:text-gray-200">Field Mappings</h4>
            <button
              onClick={addFieldMapping}
              className="flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Mapping
            </button>
          </div>
          
          <div className="space-y-3">
            {Object.entries(fieldMappings).length === 0 ? (
               <p className="text-sm text-gray-500 italic">No field mappings configured. Data will use Meta's raw field names.</p>
            ) : (
              Object.entries(fieldMappings).map(([metaField, columnKey], index) => (
                <div key={index} className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 block">Meta Field Name</label>
                    <input
                      type="text"
                      value={metaField}
                      onChange={(e) => {
                        const newMappings = { ...fieldMappings };
                        delete newMappings[metaField];
                        newMappings[e.target.value] = columnKey;
                        setFieldMappings(newMappings);
                      }}
                      className="w-full mt-1 rounded border border-gray-300 dark:border-gray-600 px-2 py-1 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                      placeholder="e.g. full_name"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 block">Target Grid Column</label>
                    <select
                      value={columnKey}
                      onChange={(e) => updateFieldMapping(metaField, e.target.value)}
                      className="w-full mt-1 rounded border border-gray-300 dark:border-gray-600 px-2 py-1 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                    >
                      <option value="">Select a column...</option>
                      {allColumns.map(col => (
                        <option key={col.key} value={col.key}>{col.label} ({col.key})</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => deleteFieldMapping(metaField)}
                    className="mt-5 p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-md font-medium text-gray-800 dark:text-gray-200">Form Mappings</h4>
            <button
              onClick={addFormMapping}
              className="flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Form
            </button>
          </div>
          
          <div className="space-y-3">
            {Object.entries(formMappings).length === 0 ? (
               <p className="text-sm text-gray-500 italic">No form mappings configured. Leads will default to the first database.</p>
            ) : (
              Object.entries(formMappings).map(([formId, mapping]) => (
                <div key={formId} className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 block">Meta Form ID</label>
                    <input
                      type="text"
                      value={formId}
                      onChange={(e) => updateFormMapping(formId, e.target.value, mapping.databaseId)}
                      className="w-full mt-1 rounded border border-gray-300 dark:border-gray-600 px-2 py-1 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                      placeholder="e.g. 123456789"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 block">Target Database</label>
                    <select
                      value={mapping.databaseId}
                      onChange={(e) => updateFormMapping(formId, formId, e.target.value)}
                      className="w-full mt-1 rounded border border-gray-300 dark:border-gray-600 px-2 py-1 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                    >
                      {databases.map(db => (
                        <option key={db.id} value={db.id}>{db.name}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => deleteFormMapping(formId)}
                    className="mt-5 p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="pt-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Integration Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};
