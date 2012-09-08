#!/usr/bin/env ruby

require 'rubygems'
require 'bundler'
require 'sinatra'
require 'oauth2'
require 'yaml'
require 'json'
require 'mongo'
require 'mongo_mapper'
require 'rest_client'

config = YAML.load_file("config.yaml") #

APP_ID       = config["app_config"]["app_id"]
SECRET       = config["app_config"]["secret"]
PROJECT_NAME = config["app_config"]["project_name"]

MongoMapper.connection = Mongo::Connection.new(config["mongodb"]["server"], config["mongodb"]["port"])
MongoMapper.database = config["mongodb"]["database"]
MongoMapper.database.authenticate(config["mongodb"]["username"], config["mongodb"]["password"])

class TemperatureDevice
    include MongoMapper::Document
    key :guid, String
    key :access_token, String
    key :widget_token, String
end

configure do
  mime_type :json, 'application/json'
end

def client
  OAuth2::Client.new(APP_ID, SECRET, {:site => "https://a.ninja.is/", :token_url => "/oauth/access_token"})
end

get '/' do
  redirect "/auth"
end

get "/auth" do
  redirect client.auth_code.authorize_url({:redirect_uri => redirect_uri, :scope => "all"})  
end

get '/auth/callback' do
  access_token = client.auth_code.get_token(params[:code], :redirect_uri => redirect_uri)
  session[:access_token] = access_token.token
  hash_of_response = get_response('devices')
  @devices = []
  
  hash_of_response["data"].each do |d|
    device_hash = {}
    device_hash["guid"] = d[0]
    device_hash["access_token"] = session[:access_token]
    device_hash = device_hash.merge(d[1]) 
    @devices << device_hash if device_hash["device_type"] == "temperature"
  end  
  
  erb :device_list
end

get '/get/code/:guid/:access_token' do
  @widget_token = (0...50).map{ ('a'..'z').to_a[rand(26)] }.join # Random String for token
  access_token = params[:access_token]
  temperature_device = TemperatureDevice.create({ :guid => params[:guid], :access_token  => access_token.to_s, :widget_token  => @widget_token})
  temperature_device.save
  
  erb :get_code
   
end

def get_response(url)
  access_token = OAuth2::AccessToken.new(client, session[:access_token])  
  JSON.parse(access_token.get("/rest/v0/#{url}?access_token=#{session[:access_token]}").body)
end


def redirect_uri
  uri = URI.parse(request.url)
  uri.path = '/auth/callback'
  uri.query = nil
  uri.to_s
end

get '/temperature' do
   temperature_device = TemperatureDevice.all(:conditions => {'widget_token' => params["widget_token"]}).first
   response = RestClient.get "http://a.ninja.is/rest/v0/device/#{temperature_device.guid}/heartbeat?access_token=#{temperature_device.access_token}", :accepts => 'application/json', :content_type => 'application/json'
   temperature = (JSON.parse(response)["data"]["DA"] * 100).round.to_f / 100
   content_type :json
  "MyNinjaWidget.serverResponse(['#{temperature}']);"
end